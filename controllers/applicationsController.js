require('dotenv').config();

class UserController {
  async getByDate(req, res) {
    console.log({params: req.params, user: req.user});

    res.status(200).json({message: 'ok'});
  }

  async add(req, res) {
    
  }

  async delete(req, res) {
    
  }

  async getAvailableHours(req, res) { 
    
  }
}

module.exports = new UserController();
