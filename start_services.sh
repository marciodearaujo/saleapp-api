#!/bin/bash

docker-compose -f app/docker-compose.yml
docker exec -i saleappdb mysql -udbadmin -pdbadmin < db/create-database.sql
