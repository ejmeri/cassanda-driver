const cassandra = require('cassandra-driver');

console.log('\t\tInicializando conexão com o banco de dados - Cassandra\n\n');

var PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
const client = new cassandra.Client({
    contactPoints: ['127.0.0.1:9042'],
    authProvider: new PlainTextAuthProvider('cassandra', 'cassandra'),
    localDataCenter: 'datacenter1',
    keyspace: 'bank'
});


function Repository(query, params) {
    this.query = query;
    this.params = params;
}

Repository.prototype.executeQuery = function (query, params) {
    Repository.call(this, query, params);

    client.execute(this.query, this.params, { prepare: true })
        .then(_ => { },
            err => {
                console.log(`erro efetuar query: ${err}`);
            });
}

Repository.prototype.findTransactions = function (account) {
    const query = 'SELECT transactions FROM accounts WHERE agency = ? AND accountNumber = ?';
    /* params = account */
    console.log(`Valor\t|Tipo`);
    client.eachRow(query, account, { prepare: true },
        (n, row) => {
            if (row.transactions) {
                for (const transactions of row.transactions) {
                    console.log(`R$ ${transactions.value} \t|${transactions.type}`);
                }
            }
        }, (err) => {
            if (err) {
                console.log(`erro efetuar consulta: ${err}`);
            }
        });
}

Repository.prototype.findLoans = function (query, params) {
    console.log(`Parcela\t|Valor\t|Parcela paga?`);
    client.eachRow(query, params, { prepare: true },
        (n, row) => {
            console.log(row.parcelnumber + "\t|R$ " + row.parcelvalue + "\t|" + row.parcelpaid);
        }, (err) => {
            if (err) {
                console.log(`erro efetuar consulta: ${err}`);
            }
        });
}

function Account(agency, accountNumber) {
    this.agency = agency;
    this.accountNumber = accountNumber;
    this.info = `Agência: ${this.agency} Conta: ${accountNumber}`;
}

function Transaction(account, value, type) {
    Account.call(this, account.agency, account.accountNumber);
    this.value = value;
    this.type = type;
}

function Loan(account, parcelNumber, parcelPaid, value) {
    Account.call(this, account.agency, account.accountNumber);
    this.parcelNumber = parcelNumber;
    this.parcelPaid = parcelPaid;
    this.value = value;
}


Transaction.prototype.createTransaction = function (value, type) {
    if (!account.agency) {
        throw "Agência inválida";
    }
    if (!account.accountNumber) {
        throw "Número da conta inválida";
    }
    if (!value || value <= 0) {
        throw "Valor inválido";
    }

    const params = {
        agency: account.agency,
        accountNumber: account.accountNumber,
        transactions: [{
            type: type,
            value: value
        }]
    };

    let repository = new Repository();
    const sql = 'UPDATE accounts SET  transactions = transactions + ? where agency=? and accountnumber=?';

    repository.executeQuery(sql, params);
}

Transaction.prototype.createCredit = function (value) {
    console.log(`Criando transação de crédito: ${account.info} - Valor R$ ${value}\n`);
    this.createTransaction(value, 'C');
}

Transaction.prototype.createDebit = function (value) {
    console.log(`Criando transação de débito: ${account.info} - Valor R$ ${value}\n`);
    this.createTransaction(value, 'D');
}

Account.prototype.findExtract = function () {
    console.log(`Listando movimentaçoes: ${this.info}`);
    const repository = new Repository();
    repository.findTransactions(this);
}

Loan.prototype.registerLoan = function (parcelNumbers, loanValue) {
    if (!account.agency) {
        throw "Agência inválida";
    }
    if (!account.accountNumber) {
        throw "Número da conta inválida";
    }
    if (!parcelNumbers || parcelNumbers <= 0) {
        throw "Número de parcelas inválido";
    }
    if (!loanValue || loanValue <= 0) {
        throw "Valor do empréstimo inválido";
    }

    const parcelValue = (loanValue / parcelNumbers);

    for (let index = 1; index <= parcelNumbers; index++) {
        let params = {
            agency: account.agency,
            accountNumber: account.accountNumber,
            parcelNumber: index,
            parcelValue: parcelValue,
            parcelPaid: 'N'
        };

        let repository = new Repository();
        let sql = 'INSERT INTO loans (agency, accountNumber, parcelNumber, parcelValue, parcelPaid) VALUES (?, ?, ?, ?,?)';

        console.log(`Registrando parcela do empréstimo da conta: ${account.info} - Parcela ${index} - Valor R$ ${parcelValue}`);
        repository.executeQuery(sql, params);
    }

    console.log(`Empréstimo efetuado com sucesso`);
}

Loan.prototype.payParcel = function (parcelNumber) {
    if (!account.agency) {
        throw "Agência inválida";
    }
    if (!account.accountNumber) {
        throw "Número da conta inválida";
    }
    if (!parcelNumber && parcelNumber <= 0) {
        throw "Número da parcela inválido";
    }

    let params = {
        agency: account.agency,
        accountNumber: account.accountNumber,
        parcelNumber: parcelNumber,
    };

    let repository = new Repository();
    let sql = "UPDATE loans SET parcelPaid='S' WHERE agency=? and accountNumber=? and parcelNumber=?";

    console.log(`Registrando pagamento da parcela  ${account.info} - Parcela ${parcelNumber}`);
    repository.executeQuery(sql, params);
}

Loan.prototype.payAnyParcel = function (parcelNumber) {
    this.payParcel(parcelNumber);
}

Loan.prototype.payLoan = function () {
    console.log(`Registrando pagamento do empréstimo da conta ${account.info}\n`);

    const query = "SELECT agency, accountnumber, parcelnumber FROM loans WHERE agency = ? AND accountNumber = ? and parcelPaid='N' ALLOW FILTERING";
    client.eachRow(query, account, { prepare: true },
        (n, row) => {
            this.payParcel(row.parcelnumber);
        }, (err) => {
            if (err) {
                return console.log(`erro efetuar consulta: ${err}`);
            }
            return console.log(`Empréstimo quitado com sucesso`);
        });
}

Account.prototype.extractLoan = function () {
    if (!account.agency) {
        throw "Agência inválida";
    }
    if (!account.accountNumber) {
        throw "Número da conta inválida";
    }

    let repository = new Repository();
    const sql = 'SELECT parcelNumber, parcelValue, parcelPaid FROM loans WHERE agency = ? AND accountNumber = ?';

    console.log(`Listando empréstimos da conta: ${account.info}\n`);
    repository.findLoans(sql, account);

}


/* Funções disponíveis na aplicação */

// Inicializa classes
const account = new Account(123, 456);
const transations = new Transaction(account);
const loans = new Loan(account);


// - Efetuar crédito
// transations.createCredit(100);

// - Efetuar débito
// transations.createDebit(30);

// - Registrar empréstimo
// loans.registerLoan(5, 500);

// - Efetuar pagamento de uma parcela
// loans.payAnyParcel(1);

// - Efetuar pagamento do empréstimo
// loans.payLoan();

// - Visualizar extrato da conta
// account.findExtract();

// - Visualizar extrato de empréstimo
// account.extractLoan();