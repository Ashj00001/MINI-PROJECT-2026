const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect('mongodb+srv://abeldaneesh_db_user:TheDarkAvenger%40@abelswolf.ipogkci.mongodb.net/training_db?retryWrites=true&w=majority&appName=abelswolf')
  .then(async () => {
    const Schema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', Schema);
    const users = await User.find({});
    const mapped = users.map(u => ({
      name: u.get('name'),
      email: u.get('email'),
      role: u.get('role'),
      institutionId: u.get('institutionId'),
      specialization: u.get('specialization'),
      status: u.get('status')
    }));
    
    fs.writeFileSync('dump.json', JSON.stringify(mapped, null, 2));
    process.exit(0);
  });
