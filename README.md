
# Helpers

- Instalando Cassanda Driver: <https://github.com/datastax/nodejs-driver>

## Criando workspace no cassandra

    CREATE KEYSPACE bank WITH replication= {'class': 'SimpleStrategy', 'replication_factor': 1};

## Scripts para a criacao das tabelas

    - Transações

    CREATE TABLE IF NOT EXISTS bank.transactions (
        agency int,
        accountNumber int,
        type text,
        value float,
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

## Ações do Projeto

- Efetuar crédito
- Efetuar débito
- Visualizar extrato
- Registrar empréstimo
- Efetuar pagamento de uma parcela do empréstimo
- Efetuar pagamento do empréstimo
- Visualizar extrato do empréstimo

## Tecnologias usadas

- Nodejs
  - Download: <https://nodejs.org/en/>
  - Documentação: <https://nodejs.org/en/docs/>

- Banco de dados Cassandra
  - Download: <https://cassandra.apache.org/download/>
  - Documentação: <https://cassandra.apache.org/doc/latest/>
