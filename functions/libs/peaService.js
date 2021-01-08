
var soap = require('soap');

let createClient = (url) => new Promise((resolve, reject) => {
    soap.createClient(url, (err, client) => {
        if(err) return reject(err);
        return resolve(client);
    })
});

let login = (client, args) => new Promise((resolve, reject) => {
    client.Login_SI(args, (err, results) => {
        if(err) return reject(err);
        return resolve(results);
    });
});

let getEmployeeInfoByUserId = (client, args) => new Promise((resolve, reject)=>{
    client.GetEmployeeInfoByUserId_SI(args, (err, employeeInfo) => {
        if(err) return reject(err);
        return resolve(employeeInfo);
    })
}) 

module.exports = {
    createClient,
    login,
    getEmployeeInfoByUserId
}