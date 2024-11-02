#!/bin/bash
docker exec -i saleappdb mysql -udbadmin -pdbadmin < $(pwd)/db/create-database.sh
