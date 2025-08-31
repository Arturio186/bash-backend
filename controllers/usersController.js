require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

const generateJWT = (id, username, isActive) => {
  return jwt.sign(
    {id, username, isActive}, 
    process.env.SECRET_KEY, 
    {expiresIn: "24h"}
  );
}


class UserController {
  async register(req, res) {
    const {username, password} = req.body;
    
    const candidate = await User.getUser(username);

    if (candidate) {
      return res.status(400).json({message: "Пользователь с таким именем уже существует"});
    }
    
    const hashPassword = await bcrypt.hash(password, 5);
    
    const user = await User.create({username, password: hashPassword});

    const token = generateJWT(user.id, user.username, user.is_active);
    
    return res.status(200).json({token});
  }

  async login(req, res) {
    const {username, password} = req.body;

    const user = await User.getUser(username); 

    if (!user) {
      return res.status(400).json({message: "Пользователь с таким имененм не найден"});
    }

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      return res.status(400).json({message: "Неверный пароль"});
    }
    
    const token = generateJWT(user.id, user.username, user.is_active);

    return res.status(200).json({token});
  }
}

module.exports = new UserController();
