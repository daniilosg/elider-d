# Desktop Landing Page - Production Container
FROM nginx:stable-alpine

# Copy nginx config with gzip and cache
COPY src/nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static files
COPY src/index.html /usr/share/nginx/html/index.html
COPY src/style.css /usr/share/nginx/html/style.css
COPY src/script.js /usr/share/nginx/html/script.js
COPY src/assets/ /usr/share/nginx/html/assets/

# Expose HTTP port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
