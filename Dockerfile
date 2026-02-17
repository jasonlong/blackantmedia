FROM php:7.4-apache

RUN a2enmod rewrite

RUN echo '<Directory /var/www/html>\n    AllowOverride All\n</Directory>' >> /etc/apache2/apache2.conf

RUN echo "ServerName localhost:80" >> /etc/apache2/apache2.conf

WORKDIR /var/www/html

COPY --chown=www-data:www-data . .

RUN mkdir -p app/_cache && chmod 777 app/_cache

RUN echo '<?php' > config/settings.php

CMD ["apache2-foreground"]
