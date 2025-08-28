const db = require('../database/db');

class User {
  static async create(surname, name, password, email, birth_date, gender) {
    const [user] = await db('users')
      .returning('*')
      .insert({ 
        surname: surname, 
        name: name,
        email: email,
        password: password,
        birth_date: birth_date,
        gender: gender
    });

    return user;
  }

  static async getUserByEmail(email) {
    const user = await db('users').where({email}).first();
    return user;
  }
} 
  
module.exports = User;
