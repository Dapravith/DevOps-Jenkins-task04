# Task 4: API Pipeline Implementation with Jenkins, Docker, EC2, and GitHub Webhooks

## Project Overview
**Company:** Food Express - Online Food Ordering Platform  
**Objective:** Implement an automated CI/CD pipeline that builds, tests, containerizes, and deploys Node.js REST APIs whenever developers push code to GitHub.

**Pipeline Flow:**
```
Developer Push Code → GitHub → Webhook Trigger → Jenkins → Build & Test → 
Docker Image → Deploy to EC2 → Running Container
```

---

## Task 1: Create Public GitHub Repository & Clone to Local Machine

### Step 1.1: Create Repository on GitHub
1. Go to `https://github.com/new`
2. Fill in repository details:
   - **Repository name:** `jenkins` (or your preferred name)
   - **Description:** NodeJS API Pipeline using Jenkins Docker EC2
   - **Visibility:** Public
   - **Add README:** Yes
   - **Add .gitignore:** Node
   - **License:** Apache License 2.0
3. Click **Create repository**

### Step 1.2: Clone to Local Machine
```bash
# Open Command Prompt/Terminal in desired directory
git clone https://github.com/<your-username>/jenkins.git
cd jenkins
```

**Expected Output:**
```
Cloning into 'jenkins'...
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (4/4), done.
Receiving objects: 100% (5/5), 5.74 KiB | 1.44 MiB/s, done.
```

---

## Task 2: Create Node.js Project with GET APIs

### Step 2.1: Create Project Folder
```bash
# Inside cloned repository
mkdir NodeAPI
cd NodeAPI
```

### Step 2.2: Initialize Node.js Project
```bash
npm init -y
```

This creates `package.json`:
```json
{
  "name": "nodeapi",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs"
}
```

### Step 2.3: Install Express Framework
```bash
npm install express
```

**Output:**
```
added 65 packages, and audited 66 packages in 3s
found 0 vulnerabilities
```

### Step 2.4: Create index.js with GET APIs
Create file: `NodeAPI/index.js`

```javascript
// IMPORT Express Server
const e1 = require('express');
const app = e1();

//SEARCH API
app.get('/search', (req, res) => {
  res.send('<html><body>INSIDE SEARCH API..</body></html>');
});

//VIEW API
app.get('/view', (req, res) => {
  res.send('<html><body>INSIDE VIEW API..</body></html>');
});

// START THE EXPRESS SERVER. 5000 is the PORT NUMBER
app.listen(5000, () =>
  console.log('EXPRESS Server Started at Port No: 5000'));
```

### Step 2.5: Test Locally
```bash
# Start the server
node index.js
```

**Expected Output:**
```
EXPRESS Server Started at Port No: 5000
```

### Step 2.6: Test APIs with Postman/Browser
- **GET /search:** `http://localhost:5000/search` → "INSIDE SEARCH API.."
- **GET /view:** `http://localhost:5000/view` → "INSIDE VIEW API.."

---

## Task 3: Commit & Push to GitHub

### Step 3.1: Stage Changes
```bash
# From jenkins/NodeAPI directory
cd ..  # Go back to jenkins root
git add .
```

### Step 3.2: Commit Changes
```bash
git commit -m "Initial commit: Node.js API with GET endpoints"
```

### Step 3.3: Push to GitHub
```bash
git push origin main
```

**Verify on GitHub:** Your repository should now contain:
- `.gitignore`
- `LICENSE`
- `README.md`
- `NodeAPI/` folder with `index.js`, `package.json`, `package-lock.json`, `node_modules/`

---

## Task 4: Create EC2 Instance with Ubuntu

### Step 4.1: Launch EC2 Instance
1. Go to AWS Management Console
2. Navigate to EC2 Dashboard
3. Click **Launch Instances**

### Step 4.2: Configure Instance
1. **Name:** `Jenkins-Server` (or preferred name)
2. **AMI:** Ubuntu Server 22.04 LTS (free tier eligible)
3. **Instance Type:** `t2.micro` (free tier)
4. **Key Pair:** Create new keypair
   - Name: `jenkins-key`
   - Type: RSA
   - Format: .pem (for Mac/Linux) or .ppk (for PuTTY on Windows)
   - Download and store safely
5. **Network Settings:**
   - Create new security group: `jenkins-sg`
   - Allow SSH (22), HTTP (80), Custom TCP (8080 for Jenkins), Custom TCP (5000 for API)

### Step 4.3: Security Group Inbound Rules
```
Type              Protocol  Port Range  Source
SSH               TCP       22          0.0.0.0/0
HTTP              TCP       80          0.0.0.0/0
Custom TCP        TCP       8080        0.0.0.0/0
Custom TCP        TCP       5000        0.0.0.0/0
```

### Step 4.4: Launch & Get Public IP
1. Click **Launch Instance**
2. Wait for instance to reach "running" state
3. Copy **Public IP Address** (e.g., `54.123.45.67`)

### Step 4.5: Connect to EC2
**For Windows (PuTTY):**
```bash
putty -i jenkins-key.ppk ubuntu@<PUBLIC_IP>
```

**For Mac/Linux:**
```bash
chmod 400 jenkins-key.pem
ssh -i jenkins-key.pem ubuntu@<PUBLIC_IP>
```

---

## Task 5: Install Jenkins in EC2 Instance

### Step 5.1: Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 5.2: Install Java (Required for Jenkins)
```bash
sudo apt install openjdk-11-jdk -y
java -version
```

### Step 5.3: Install Jenkins
```bash
# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Jenkins
sudo apt update
sudo apt install jenkins -y
```

### Step 5.4: Start Jenkins Service
```bash
sudo systemctl start jenkins
sudo systemctl enable jenkins
sudo systemctl status jenkins
```

### Step 5.5: Configure Firewall (if needed)
```bash
sudo ufw allow 8080
sudo ufw allow 22
sudo ufw enable
```

### Step 5.6: Access Jenkins Web UI
1. Open browser: `http://<PUBLIC_IP>:8080`
2. Get initial admin password:
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
3. Paste password, complete setup, install recommended plugins

---

## Task 6.1: Create Pipeline & Configure for Webhooks

### Step 6.1.1: Create New Pipeline Job
1. Jenkins Dashboard → **New Item**
2. **Item name:** `NodeJS-Docker-API-Pipeline`
3. **Type:** Pipeline
4. Click **OK**

### Step 6.1.2: Configure Pipeline
1. **Description:** Automated API Pipeline with Docker & EC2
2. **GitHub Project:** Check box, enter: `https://github.com/<username>/jenkins`
3. **Build Triggers:** Check **GitHub hook trigger for GITScm polling**
4. **Pipeline Script:**

```groovy
pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                echo 'Clone the Code from GitHub'
                git url: 'https://github.com/<your-username>/jenkins.git', branch: 'main'
                echo 'Cloning Done'
            }
        }
        stage('Copy') {
            steps {
                echo 'Copy from Jenkins Working Directory To /home/ubuntu/proj Directory'
                sh '''
                rm -rf /home/ubuntu/NodeAPI
                cp -r /var/lib/jenkins/workspace/NodeJS-Docker-API-Pipeline/NodeAPI /home/ubuntu/
                
                rm -rf /home/ubuntu/current/
                mkdir /home/ubuntu/current
                cp -r /var/lib/jenkins/workspace/NodeJS-Docker-API-Pipeline/NodeAPI/* /home/ubuntu/current/
                '''
                echo 'Copy Done'
            }
        }
        stage('Build Docker Image') {
            steps {
                echo 'Start building docker Image'
                sh '''
                cd /home/ubuntu/current
                docker build -t <dockerhub-username>/nodejsapi:v1.0 .
                '''
                echo 'Build Complete'
            }
        }
        stage('Run Image As Container') {
            steps {
                echo 'Start building container to Run'
                sh '''
                if lsof -i 5000 -t >/dev/null; then
                   echo "Port 5000 is in use, killing process..."
                   sudo fuser -k 5000/tcp
                fi
 
                docker stop nodejsapi-container || true
                docker rm nodejsapi-container || true
                docker run --name nodejsapi-container -d -p 5000:5000 <dockerhub-username>/nodejsapi:v1.0
                '''
                echo 'NodeJS API running in a Container(docker)'
            }
        }
    }
    post {
        failure {
            echo 'Check Console Log for failure'
        }
        success {
            echo 'Deployment Success..APIs are running'
        }
    }
}
```

5. Click **Save**

---

## Task 6.2: Manual Build Test

### Step 6.2.1: Execute Manual Build
1. Jenkins Dashboard → Select **NodeJS-Docker-API-Pipeline**
2. Click **Build Now**
3. Monitor each stage in **Build Output**

### Step 6.2.2: Verify Each Stage
- ✅ **Clone:** Code pulled from GitHub
- ✅ **Copy:** Files copied to `/home/ubuntu/current/`
- ✅ **Build Docker Image:** Docker image created
- ✅ **Run Container:** Container running on port 5000

---

## Task 6.3: Install Necessary Software on EC2

### Step 6.3.1: Install Docker
```bash
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
```

### Step 6.3.2: Verify Docker Installation
```bash
docker --version
```

### Step 6.3.3: Install Node.js Runtime (optional)
```bash
sudo apt install nodejs npm -y
```

### Step 6.3.4: Restart Jenkins (Important!)
```bash
sudo systemctl restart jenkins
```

---

## Task 6.4: Set Jenkins Permissions

### Step 6.4.1: Configure Jenkins User Permissions
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo usermod -aG sudo jenkins

# Set permissions for /home/ubuntu directory
sudo chown -R jenkins:jenkins /home/ubuntu
sudo chmod -R 755 /home/ubuntu

# Allow jenkins to run docker without password
sudo visudo
# Add line: jenkins ALL=(ALL) NOPASSWD: ALL
```

### Step 6.4.2: Test Permissions
```bash
# Switch to jenkins user
sudo su jenkins
docker ps
```

---

## Task 7: Create Docker Image

### Step 7.1: Create Dockerfile
Create `NodeAPI/Dockerfile`:

```dockerfile
# Use lightweight Node.js Alpine image
FROM node:24.14.0-alpine3.22

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "index.js"]
```

### Step 7.2: Create .dockerignore
Create `NodeAPI/.dockerignore`:

```
node_modules
npm-debug.log
.git
.gitignore
```

### Step 7.3: Build Docker Image Locally (Optional Test)
```bash
cd NodeAPI
docker build -t <dockerhub-username>/nodejsapi:v1.0 .
```

### Step 7.4: Commit & Push Dockerfile
```bash
cd ..
git add Dockerfile .dockerignore
git commit -m "Add Docker configuration"
git push origin main
```

---

## Task 8: Deploy to EC2

### Step 8.1: Trigger Pipeline Manually
1. Jenkins Dashboard → **NodeJS-Docker-API-Pipeline**
2. Click **Build Now**
3. Wait for all stages to complete

### Step 8.2: Verify Container Running on EC2
```bash
# SSH into EC2
ssh -i jenkins-key.pem ubuntu@<PUBLIC_IP>

# Check running containers
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                          COMMAND           STATUS       PORTS
abc123def456   <username>/nodejsapi:v1.0     "node index.js"   Up 5 mins    0.0.0.0:5000->5000/tcp
```

### Step 8.3: Test API from EC2
```bash
curl http://localhost:5000/search
# Output: INSIDE SEARCH API..
```

---

## Task 9: Access GET API Using Postman

### Step 9.1: Test Search API
1. Open Postman
2. Create new request
3. **Method:** GET
4. **URL:** `http://<EC2_PUBLIC_IP>:5000/search`
5. Click **Send**
6. **Response:** `INSIDE SEARCH API..` with Status 200 OK

### Step 9.2: Test View API
1. **Method:** GET
2. **URL:** `http://<EC2_PUBLIC_IP>:5000/view`
3. Click **Send**
4. **Response:** `INSIDE VIEW API..` with Status 200 OK

---

## Task 10: Configure GitHub Webhooks

### Step 10.1: Get Jenkins Webhook URL
```
http://<EC2_PUBLIC_IP>:8080/github-webhook/
```

### Step 10.2: Add Webhook to GitHub
1. Go to GitHub repository → **Settings**
2. Navigate to **Webhooks** → **Add webhook**
3. **Payload URL:** `http://<EC2_PUBLIC_IP>:8080/github-webhook/`
4. **Content type:** `application/json`
5. **Trigger events:** 
   - ✅ Push events
   - ✅ Pull requests
6. **Active:** Checked
7. Click **Add webhook**

### Step 10.3: Verify Webhook
1. Recent Deliveries section should show successful delivery (✅ green checkmark)
2. Status code 200 indicates successful connection

---

## Task 11: Add POST/PUT/DELETE APIs

### Step 11.1: Update index.js with Additional APIs
Edit `NodeAPI/index.js`:

```javascript
// IMPORT Express Server
const e1 = require('express');
const app = e1();

// Middleware to parse JSON
app.use(e1.json());

//SEARCH API (GET)
app.get('/search', (req, res) => {
  res.send('<html><body>INSIDE SEARCH API..</body></html>');
});

//VIEW API (GET)
app.get('/view', (req, res) => {
  res.send('<html><body>INSIDE VIEW API..</body></html>');
});

//LOGIN API (POST)
app.post('/login', (req, res) => {
  res.send('<html><body>INSIDE LOGIN API..</body></html>');
});

//UPDATE PROFILE API (PUT)
app.put('/updateprofile', (req, res) => {
  res.send('<html><body>INSIDE UPDATE PROFILE API..</body></html>');
});

//DELETE API (DELETE)
app.delete('/del', (req, res) => {
  res.send('<html><body>INSIDE DELETE API..</body></html>');
});

// START THE EXPRESS SERVER. 5000 is the PORT NUMBER
app.listen(5000, () =>
  console.log('EXPRESS Server Started at Port No: 5000'));
```

### Step 11.2: Test Locally (Optional)
```bash
cd NodeAPI
node index.js
```

Test in Postman:
- **POST /login**
- **PUT /updateprofile**
- **DELETE /del**

---

## Task 12: Commit Changes

```bash
# From jenkins root directory
git add .
git commit -m "Add POST, PUT, DELETE API endpoints"
```

---

## Task 13: Push to GitHub

```bash
git push origin main
```

**GitHub Webhook Triggered:** Jenkins should automatically start building the pipeline.

---

## Task 14: Test New APIs Using Postman

### Step 14.1: Test POST API
1. **Method:** POST
2. **URL:** `http://<EC2_PUBLIC_IP>:5000/login`
3. **Headers:** `Content-Type: application/json`
4. Click **Send**
5. **Response:** `INSIDE LOGIN API..` with Status 200 OK

### Step 14.2: Test PUT API
1. **Method:** PUT
2. **URL:** `http://<EC2_PUBLIC_IP>:5000/updateprofile`
3. **Headers:** `Content-Type: application/json`
4. Click **Send**
5. **Response:** `INSIDE UPDATE PROFILE API..` with Status 200 OK

### Step 14.3: Test DELETE API
1. **Method:** DELETE
2. **URL:** `http://<EC2_PUBLIC_IP>:5000/del`
3. Click **Send**
4. **Response:** `INSIDE DELETE API..` with Status 200 OK

---

## Troubleshooting Guide

### Issue: Docker Build Fails
**Solution:**
```bash
# Install Docker properly
sudo apt install docker.io -y
docker --version

# Restart Jenkins
sudo systemctl restart jenkins
```

### Issue: Port 5000 Already in Use
**Solution:**
```bash
# Kill existing process
sudo fuser -k 5000/tcp

# Or check what's using it
lsof -i :5000
```

### Issue: Webhook Not Triggering
**Solution:**
1. Verify webhook URL format: `http://<IP>:8080/github-webhook/`
2. Check Jenkins log: `/var/log/jenkins/jenkins.log`
3. Verify GitHub webhook recent deliveries show success
4. Ensure EC2 Security Group allows inbound HTTP/HTTPS

### Issue: Jenkins Cannot Pull from GitHub
**Solution:**
```bash
# Update git
sudo apt install git -y

# Configure Jenkins credentials
# Jenkins → Credentials → Add GitHub credentials
```

### Issue: API Not Accessible from External IP
**Solution:**
1. Verify EC2 Security Group allows port 5000
2. Check container is running: `docker ps`
3. Test locally first: `curl localhost:5000/search`

---

## Summary Checklist

- ✅ Task 1: GitHub repo created and cloned
- ✅ Task 2: Node.js project with GET APIs created
- ✅ Task 3: Code committed and pushed to GitHub
- ✅ Task 4: EC2 instance created with Ubuntu
- ✅ Task 5: Jenkins installed on EC2
- ✅ Task 6.1: Pipeline created and webhook configured
- ✅ Task 6.2: Manual build tested
- ✅ Task 6.3: Docker and required software installed
- ✅ Task 6.4: Jenkins permissions configured
- ✅ Task 7: Dockerfile created
- ✅ Task 8: Docker image deployed to EC2
- ✅ Task 9: GET APIs tested with Postman
- ✅ Task 10: GitHub webhook configured
- ✅ Task 11: POST/PUT/DELETE APIs added
- ✅ Task 12: Changes committed
- ✅ Task 13: Code pushed to GitHub (webhook triggers)
- ✅ Task 14: New APIs tested with Postman

---

## Key Concepts Learned

1. **CI/CD Pipeline:** Automated build, test, and deployment process
2. **GitHub Webhooks:** Event-driven trigger for automated builds
3. **Jenkins:** Orchestration tool for CI/CD workflows
4. **Docker:** Containerization for consistent deployments
5. **AWS EC2:** Cloud infrastructure for hosting applications
6. **Infrastructure as Code:** Automation through scripting and configuration

---

**Final Notes:**
- Always test each stage individually before running end-to-end
- Keep Docker images lean using Alpine-based images
- Implement proper security groups and access controls
- Monitor Jenkins logs for troubleshooting
- Use version tags for Docker images (v1.0, v1.1, etc.)
