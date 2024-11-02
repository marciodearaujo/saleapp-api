#!/bin/bash
docker exec -i saleappdb mysql -udbadmin -pdbadmin < db/create-database.sh
