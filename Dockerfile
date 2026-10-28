FROM php:8.4.27-apache

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && echo 'session.upload_progress.enabled=0' > "$PHP_INI_DIR/conf.d/security.ini"

RUN a2enmod rewrite

RUN echo '<Directory /var/www/html>\n    AllowOverride All\n</Directory>' >> /etc/apache2/apache2.conf

RUN echo "ServerName localhost:80" >> /etc/apache2/apache2.conf

WORKDIR /var/www/html

COPY --chown=www-data:www-data . .

RUN mkdir -p app/_cache && chown www-data:www-data app/_cache && chmod 755 app/_cache

RUN echo '<?php' > config/settings.php

CMD ["apache2-foreground"]
