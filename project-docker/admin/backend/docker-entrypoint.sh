#!/bin/bash

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
  sleep 1
done
echo "PostgreSQL started"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 