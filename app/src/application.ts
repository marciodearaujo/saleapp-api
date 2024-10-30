import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {SecretsManagerClient,GetSecretValueCommand,} from "@aws-sdk/client-secrets-manager";
import 'dotenv/config'
import {fromIni} from '@aws-sdk/credential-providers';


export {ApplicationConfig};

export let DBConnectionConfig = {
  name: 'mysql',
  connector: 'mysql',
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};
console.log(DBConnectionConfig)

export class SaleappApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  async boot(){

    interface AWSSecretManagerDBCredencials{
      user:string,
      password:string,
      engine:string,
      host:string,
      port:number,
      database:string,
      dbInstanceIdentifier:string
    }

    let DBCredencials:AWSSecretManagerDBCredencials

      try {
        const secret_name = process.env.AWS_SECRET_NAME;

        const client = new SecretsManagerClient({
          region: "us-east-1",
          //credentials: fromIni({profile:"default"})
        });
        const response = await client.send(
          new GetSecretValueCommand({
            SecretId: secret_name,
            VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
          })
        );
        if(response.SecretString){
            DBCredencials=JSON.parse(response.SecretString)
            DBConnectionConfig={...DBConnectionConfig,
            user: DBCredencials.user,
            password: DBCredencials.password,
            database: DBCredencials.database,
                  }
        }
      } catch (error) {
        // For a list of exceptions thrown, see
        // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        console.log("Message: The database credentials from AWS secret manager is not configured. In this case, the app use by default the list of envioronment variables:MYSQL_HOST,MYSQL_PORT,MYSQL_USER,MYSQL_PASSWORD,MYSQL_DATABASE");
      }
    await super.boot()
  }
}
