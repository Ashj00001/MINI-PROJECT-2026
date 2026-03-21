const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://abeldaneesh_db_user:TheDarkAvenger%40@abelswolf.ipogkci.mongodb.net/training_db?retryWrites=true&w=majority&appName=abelswolf')
  .then(async () => {
    const Schema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', Schema);
    // Find all users
    const users = await User.find({});
    // Format them
    const mapped = users.map(u => ({
      name: u.get('name'),
      email: u.get('email'),
      role: u.get('role'),
      institutionId: u.get('institutionId'),
      specialization: u.get('specialization')
    }));
    
    console.log(JSON.stringify(mapped, null, 2));
    process.exit(0);
  });
