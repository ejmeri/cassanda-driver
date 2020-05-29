
# Utilizando Cassandra e Nodejs

- Referências
  - DataStax Node.js Driver for Apache Cassandra: <https://github.com/datastax/nodejs-driver>
  - Using a user-defined type: <https://docs.datastax.com/en/archived/cql/3.1/cql/cql_using/cqlUseUDT.html>
  - Collection type: <https://docs.datastax.com/en/archived/cql/3.1/cql/cql_reference/collection_type_r.html>
  - Please stop using Classes in JavaScript: <https://medium.com/javascript-in-plain-english/please-stop-using-classes-in-javascript-and-become-a-better-developer-a185c9fbede1>

## Tecnologias usadas

- Nodejs
  - Download: <https://nodejs.org/en/>
  - Documentação: <https://nodejs.org/en/docs/>
    - Bibliotecas utilizadas
      - Cassandra Driver: <https://www.npmjs.com/package/cassandra-driver>

- Banco de dados Cassandra
  - Download: <https://cassandra.apache.org/download/>
  - Documentação: <https://cassandra.apache.org/doc/latest/>

## Ações do Projeto

- Conta
  - Efetuar crédito
  - Efetuar débito
  - Visualizar extrato

- Empréstimo
  - Registrar empréstimo
  - Efetuar pagamento de uma parcela do empréstimo
  - Efetuar pagamento do empréstimo
  - Visualizar extrato do empréstimo

## Criando workspace no cassandra

    CREATE KEYSPACE bank WITH replication= {'class': 'SimpleStrategy', 'replication_factor': 1};

## Scripts para a criação das tabelas e types utilizados

    - Transações

    Create TYPE bank.transactions(
        type text,
        value float,
    );

    - Contas

    CREATE TABLE IF NOT EXISTS bank.accounts (
        agency int,
        accountNumber int,
        transactions list<frozen<transactions>>,
        PRIMARY KEY (agency, accountNumber)
    );

    - Empréstimos

    CREATE TABLE IF NOT EXISTS bank.loans (
        agency int,
        accountNumber int,
        parcelNumber int,
        parcelValue float,
        parcelPaid text,    
        PRIMARY KEY (agency, accountNumber, parcelNumber)
    );
