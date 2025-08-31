const db = require('../database/db');

class User {
  static async create({username, password}) {
    const [user] = await db('users')
      .returning('*')
      .insert({ 
        username,
        password
    });

    return user;
  }

  static async getUser(username) {
    const user = await db('users').where({username}).first();
    return user;
  }
} 
  
module.exports = User;
