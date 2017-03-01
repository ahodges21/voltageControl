# Dockerfile with node and wiring pi
# Based on debian with nginx installed

# Set the base image to nginx
FROM hypriot/rpi-node

# File Author / Maintainer
MAINTAINER asyed5@gsu.edu

# Install wiringPi
RUN git clone git://git.drogon.net/wiringPi
RUN cd wiringPi && ./build

# Symlink nodejs to node
RUN ln -s `which nodejs` /usr/local/bin/node

# NPM Install globals
RUN npm install -g bower

# Install nginx
RUN apt-get update && apt-get install -y nginx

# Forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log
RUN ln -sf /dev/stderr /var/log/nginx/error.log

VOLUME ["/usr/share/nginx/html"]
VOLUME ["/etc/nginx"]

# Remove the default Nginx configuration file
RUN rm -v /etc/nginx/nginx.conf

# Copy a configuration file from the current directory
ADD nginx.conf /etc/nginx/

WORKDIR /usr/share/nginx/html

# Expose the default ports
EXPOSE 80 443

# Start nginx through the npm package.josn file
ENTRYPOINT ["npm","start"]