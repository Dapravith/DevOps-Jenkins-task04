const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


let users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543211'
  }
];

let nextUserId = 3;

app.get('/search', (req, res) => {
  try {
    const response = {
      status: 'success',
      message: 'INSIDE SEARCH API..',
      timestamp: new Date().toISOString(),
      path: '/search',
      method: 'GET'
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/view', (req, res) => {
  try {
    const response = {
      status: 'success',
      message: 'INSIDE VIEW API..',
      timestamp: new Date().toISOString(),
      data: users,
      count: users.length
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        id: userId
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User found',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    const response = {
      status: 'success',
      message: 'INSIDE LOGIN API..',
      timestamp: new Date().toISOString(),
      user: username,
      token: 'jwt_token_' + Math.random().toString(36).substr(2, 9),
      authenticated: true
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/users', (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and email are required'
      });
    }

    const newUser = {
      id: nextUserId++,
      name: name,
      email: email,
      phone: phone || 'N/A'
    };

    users.push(newUser);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.put('/updateprofile', (req, res) => {
  try {
    const { id, name, email, phone } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        id: id
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    const response = {
      status: 'success',
      message: 'INSIDE UPDATE PROFILE API..',
      timestamp: new Date().toISOString(),
      data: user,
      updated: true
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.put('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, phone } = req.body;

    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        id: userId
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.delete('/del', (req, res) => {
  try {
    const response = {
      status: 'success',
      message: 'INSIDE DELETE API..',
      timestamp: new Date().toISOString(),
      deleted: true,
      deletedId: Math.floor(Math.random() * 1000)
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        id: userId
      });
    }

    const deletedUser = users.splice(userIndex, 1);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: deletedUser[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Food Express API',
    version: '1.0.0',
    endpoints: {
      get: ['/search', '/view', '/users/:id', '/health'],
      post: ['/login', '/users'],
      put: ['/updateprofile', '/users/:id'],
      delete: ['/del', '/users/:id']
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('EXPRESS Server Started at Port No: ' + PORT);
});
