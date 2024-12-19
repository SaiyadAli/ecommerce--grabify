const adminModel = require('../model/adminModel')
const bcrypt = require('bcrypt');
const userModel = require('../model/userModel')

const loadLogin = async (req, res) => {

    res.render('admin/login')

}
let loadCustomers = async (req, res) => {
    try {

        const admin = req.session.admin
        if(!admin) return res.redirect('/admin/login')

        const users = await userModel.find({})

        res.render('admin/customers',{users,message: ''})
        


    } catch (error) {
        
    }
}


const login = async (req, res) => {

try {

    const {email, password} = req.body

    console.log(email)
    const admin = await adminModel.findOne({email})


    if(!admin) return res.render('admin/login', {message: 'admin not found'})


    const isMatch = await bcrypt.compare(password, admin.password)

    if(!isMatch) return res.render('admin/login', {message: 'Invalid credentials'})

    req.session.admin = true

    res.redirect('/admin/dashboard')

    
} catch (error) {
    
    res.send(error)
}

}

const loadDashboard = async (req, res) => {

    try {

        const admin = req.session.admin
        if(!admin) return res.redirect('/admin/login')

        const users = await userModel.find({})

        res.render('admin/dashboard',{users,message: ''})
        


    } catch (error) {
        
    }
}




// const editUser = async (req, res) => {
//     try {
//         const { email, password, id } = req.body;

//         // Check if the email already exists for another user
//         const existingUser = await userModel.findOne({ email });
//         if (existingUser && existingUser._id.toString() !== id) {
//             return res.render('admin/dashboard', {
//                 users: await userModel.find({}),
//                 message: 'Email already exists!' // Add error message for duplicate email
//             });
//         }

//         const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

//         const user = await userModel.findOneAndUpdate({ _id: id }, {
//             $set: {
//                 email,
//                 password: hashedPassword ? hashedPassword : undefined
//             }
//         });

//         res.redirect('/admin/dashboard');
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Internal Server Error');
//     }
// };


const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      const user = await userModel.findOneAndDelete({ _id: id });
  
      if (user) {
        
        return res.status(200).json({ message: 'User deleted successfully.' });
      } else {
        return res.status(404).json({ message: 'User not found.' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };


  const editUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the user and toggle the isBlock status
      const user = await userModel.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      user.isBlock = !user.isBlock; // Toggle the status
      await user.save();
  
      res.status(200).json({ message: `User status updated to ${user.isBlock ? 'Blocked' : 'Live'}.` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
  
// const addUser = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Check if the email already exists
//         const existingUser = await userModel.findOne({ email });
//         if (existingUser) {
//             return res.render('admin/dashboard', {
//                 users: await userModel.find({}),
//                 message: 'Email already exists!' // Add error message for duplicate email
//             });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = new userModel({
//             email,
//             password: hashedPassword
//         });

//         await newUser.save();

//         res.redirect('/admin/dashboard');
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Internal Server Error');
//     }
// };


const logout = async (req, res) => {

    req.session.admin = null

    res.redirect('/admin/login')
}
   





module.exports = {loadLogin,login, loadDashboard,loadCustomers ,editUserStatus,  deleteUser,  logout};
