FROM oraclelinux:7-slim

ADD linux-binaries/oracle-instantclient*.rpm /tmp/

RUN yum -y install oracle-release-el7 oracle-nodejs-release-el7 && \
    yum-config-manager --disable ol7_developer_EPEL

RUN  yum -y install /tmp/oracle-instantclient*.rpm nodejs && \
     rm -rf /var/cache/yum && \
     rm -f /tmp/oracle-instantclient*.rpm && \
     echo /usr/lib/oracle/12.2/client64/lib > /etc/ld.so.conf.d/oracle-instantclient12.2.conf && \
     ldconfig

ENV PATH=$PATH:/usr/lib/oracle/12.2/client64/bin

WORKDIR /app
ADD . /app/

# move wallet credentials to default dir for Oracle
COPY build-resource/wallet/* /usr/lib/oracle/19.3/client64/lib/network/admin/
ENV TNS_ADMIN=/usr/lib/oracle/19.3/client64/lib/network/admin/
COPY package.json /app
EXPOSE 8080
EXPOSE 4000
RUN npm install

ENTRYPOINT [ "npm", "start"]