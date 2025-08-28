require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');


const generateJWT = (id, email, role) => {
  return jwt.sign(
    {id, email, role}, 
    process.env.SECRET_KEY, 
    {expiresIn: "6h"}
  );
}


class UserController {
  async register(req, res) {
    const {surname, name, email, password, birth_date, gender} = req.body;
    
    const candidate = await User.getUserByEmail(email);

    if (candidate) {
      return res.status(400).json({message: "Пользователь с таким e-mail уже существует"});
    }
    
    const hashPassword = await bcrypt.hash(password, 5);
    
    const user = await User.create(surname, name, hashPassword, email, birth_date, gender);

    const token = generateJWT(user.id, user.email, user.role);
    
    return res.json({token});
  }

  async login(req, res) {
    const {email, password} = req.body;

    const user = await User.getUserByEmail(email); 

    if (!user) {
      return res.status(400).json({message: "Пользователь с таким e-mail не найден"});
    }

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      return res.status(400).json({message: "Неверный пароль"});
    }
    
    const token = generateJWT(user.id, user.email, user.role);

    return res.json({token});
  }
}

module.exports = new UserController();
