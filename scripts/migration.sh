#!/bin/bash

echo " -> Starting migration..."
echo ""
npm run db:migrate:test
echo " -> Migration completed."
echo ""