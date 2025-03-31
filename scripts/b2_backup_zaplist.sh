#!/bin/bash

# MongoDB credentials
DB_USER=""
DB_PASS=""
DB_NAME="zaplist"
DB_PORT="27017"

# Backblaze B2 settings
B2_BUCKET="backup-bucket"
B2_PREFIX_PARENT="mongodb_backups"
B2_PREFIX_DB_NAME="zaplist"

# Backup settings
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR_PARENT="/opt/backups/mongodb"
BACKUP_DIR_DB_NAME="zaplist"
BACKUP_FILE="$BACKUP_DIR_PARENT/$BACKUP_DIR_DB_NAME/${DB_NAME}_${TIMESTAMP}.archive"
B2_FILE="$B2_PREFIX_PARENT/$B2_PREFIX_DB_NAME/${DB_NAME}_${TIMESTAMP}.archive"
echo "BACKUP_FILE: $BACKUP_FILE"
echo "B2_FILE: $B2_FILE"

# Dump the MongoDB database
mongodump --db $DB_NAME --username $DB_USER --password $DB_PASS --port $DB_PORT --archive=$BACKUP_FILE --gzip

# Keep last copy in local
BACKUP_FILE_LATEST_COPY="$BACKUP_DIR_PARENT/$BACKUP_DIR_DB_NAME/${DB_NAME}_latest.archive"
echo "BACKUP_FILE_LATEST_COPY: $BACKUP_FILE_LATEST_COPY"
rm -f $BACKUP_FILE_LATEST_COPY
cp $BACKUP_FILE $BACKUP_FILE_LATEST_COPY

# Upload backup to Backblaze B2
b2 upload-file $B2_BUCKET $BACKUP_FILE $B2_FILE

# Clean up local backup file
rm $BACKUP_FILE
