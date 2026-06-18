# Quick Reference Guide

## Essential Commands

### Git Commands
```bash
# Clone repository
git clone https://github.com/username/jenkins.git

# Navigate to project
cd jenkins

# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "message"

# Push to GitHub
git push origin main

# Create new branch
git checkout -b feature-branch

# Switch branch
git checkout main
```

### Docker Commands
```bash
# List images
docker images

# List containers
docker ps                    # Running
docker ps -a                 # All

# Build image
docker build -t username/imagename:tag .

# Run container
docker run -d -p 5000:5000 --name container-name image:tag

# Stop container
docker stop container-name

# Remove container
docker rm container-name

# View logs
docker logs container-name
docker logs -f container-name    # Follow

# Execute command in container
docker exec -it container-name /bin/sh

# Push to Docker Hub
docker push username/imagename:tag
```

### Jenkins Commands
```bash
# Start Jenkins
sudo systemctl start jenkins

# Stop Jenkins
sudo systemctl stop jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Check status
sudo systemctl status jenkins

# View logs
sudo tail -f /var/log/jenkins/jenkins.log

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### EC2 SSH Commands
```bash
# Connect to EC2 (Linux/Mac)
ssh -i jenkins-key.pem ubuntu@PUBLIC_IP

# Connect to EC2 (Windows with PuTTY)
putty -i jenkins-key.ppk ubuntu@PUBLIC_IP

# File transfer from local to EC2
scp -i jenkins-key.pem localfile.txt ubuntu@PUBLIC_IP:/home/ubuntu/

# File transfer from EC2 to local
scp -i jenkins-key.pem ubuntu@PUBLIC_IP:/home/ubuntu/file.txt ./
```

### npm Commands
```bash
# Initialize new Node.js project
npm init -y

# Install package
npm install express

# Install as development dependency
npm install --save-dev jest

# List installed packages
npm list

# Run script from package.json
npm start
npm test
npm run build
```

---

## Common File Locations

### Jenkins
- **Jenkins Home:** `/var/lib/jenkins/`
- **Logs:** `/var/log/jenkins/jenkins.log`
- **Workspace:** `/var/lib/jenkins/workspace/`
- **Initial Password:** `/var/lib/jenkins/secrets/initialAdminPassword`
- **Configuration:** `/etc/default/jenkins`

### EC2 Directories
- **Home:** `/home/ubuntu/`
- **API Code:** `/home/ubuntu/current/`
- **Docker:** `/var/lib/docker/`

### Docker
- **Images:** Docker Hub or local storage
- **Containers:** Running instances
- **Volumes:** Persistent storage

---

## Default Ports

| Service    | Port | Access URL |
|------------|------|-----------|
| Jenkins    | 8080 | `http://IP:8080` |
| Node.js API| 5000 | `http://IP:5000` |
| SSH        | 22   | `ssh -p 22 user@IP` |
| HTTP       | 80   | `http://IP` |
| HTTPS      | 443  | `https://IP` |

---

## GitHub Webhook URL

Format:
```
http://<EC2_PUBLIC_IP>:8080/github-webhook/
```

Example:
```
http://54.123.45.67:8080/github-webhook/
```

---

## Node.js API Endpoints

### GET Endpoints
```
GET /search   → "INSIDE SEARCH API.."
GET /view     → "INSIDE VIEW API.."
```

### POST Endpoints
```
POST /login   → "INSIDE LOGIN API.."
```

### PUT Endpoints
```
PUT /updateprofile   → "INSIDE UPDATE PROFILE API.."
```

### DELETE Endpoints
```
DELETE /del   → "INSIDE DELETE API.."
```

---

## Docker Image Commands - Quick Reference

### Build Image
```bash
cd NodeAPI
docker build -t username/nodejsapi:v1.0 .
```

### Run Image
```bash
docker run -d -p 5000:5000 --name nodejsapi-container username/nodejsapi:v1.0
```

### Stop & Remove
```bash
docker stop nodejsapi-container
docker rm nodejsapi-container
```

### View Image Details
```bash
docker inspect image-id
```

---

## Jenkins Pipeline Stages

### Stage 1: Clone
```groovy
stage('Clone') {
    steps {
        git url: 'https://github.com/username/jenkins.git', branch: 'main'
    }
}
```

### Stage 2: Copy
```groovy
stage('Copy') {
    steps {
        sh '''
        cp -r /var/lib/jenkins/workspace/NodeJS-Docker-API-Pipeline/NodeAPI /home/ubuntu/current/
        '''
    }
}
```

### Stage 3: Build Docker Image
```groovy
stage('Build Docker Image') {
    steps {
        sh '''
        cd /home/ubuntu/current
        docker build -t username/nodejsapi:v1.0 .
        '''
    }
}
```

### Stage 4: Run Container
```groovy
stage('Run Image As Container') {
    steps {
        sh '''
        docker stop nodejsapi-container || true
        docker rm nodejsapi-container || true
        docker run --name nodejsapi-container -d -p 5000:5000 username/nodejsapi:v1.0
        '''
    }
}
```

---

## Debugging Checklist

### Pipeline Not Triggering
- [ ] Webhook URL correct: `http://IP:8080/github-webhook/`
- [ ] GitHub webhook shows successful delivery
- [ ] "GitHub hook trigger for GITScm polling" is checked in Jenkins
- [ ] Jenkins logs show webhook events
- [ ] Try "Poll SCM": `H/5 * * * *`

### Docker Build Fails
- [ ] Dockerfile exists in project root
- [ ] Dockerfile syntax is correct
- [ ] Docker daemon is running: `docker ps`
- [ ] Docker installed: `docker --version`
- [ ] Jenkins user in docker group

### Container Won't Start
- [ ] Port 5000 not in use: `lsof -i :5000`
- [ ] Docker image exists: `docker images | grep nodejsapi`
- [ ] Container logs: `docker logs nodejsapi-container`
- [ ] Dockerfile exposes port 5000

### API Not Accessible
- [ ] Container running: `docker ps | grep nodejsapi`
- [ ] Port mapping correct: `-p 5000:5000`
- [ ] EC2 Security Group allows port 5000
- [ ] Application listening on 0.0.0.0:5000 (not localhost)
- [ ] Test locally first: `curl localhost:5000/search`

### Jenkins Permission Issues
- [ ] Jenkins user in docker group: `id jenkins`
- [ ] Sudoers configured: `sudo visudo`
- [ ] Directory permissions: `ls -la /home/ubuntu/`
- [ ] Restart Jenkins for group changes: `sudo systemctl restart jenkins`

---

## Performance Metrics

### Monitor EC2
```bash
# CPU usage
top

# Memory usage
free -h

# Disk usage
df -h
du -sh /var/lib/docker

# Network connections
netstat -an | grep 5000
netstat -an | grep 8080
```

### Check Docker Resources
```bash
# Disk space used by Docker
docker system df

# Clean up unused images/containers
docker system prune

# Container resource usage
docker stats
```

---

## Useful One-Liners

### Kill Process on Port
```bash
sudo fuser -k 5000/tcp
```

### Check Port in Use
```bash
sudo lsof -i :5000
netstat -an | grep :5000
```

### Test API Endpoint
```bash
curl http://localhost:5000/search
curl -X POST http://IP:5000/login
```

### View Last N Lines of Log
```bash
tail -100 /var/log/jenkins/jenkins.log
```

### SSH to EC2 and Run Command
```bash
ssh -i key.pem ubuntu@IP "docker ps"
```

### Copy File from EC2
```bash
scp -i key.pem ubuntu@IP:/path/to/file ./
```

---

## Important Files

### package.json
```json
{
  "name": "nodeapi",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo Error"
  },
  "dependencies": {
    "express": "^4.x.x"
  }
}
```

### Dockerfile
```dockerfile
FROM node:24.14.0-alpine3.22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

### .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
```

### index.js (Basic)
```javascript
const e1 = require('express');
const app = e1();

app.get('/search', (req, res) => {
  res.send('INSIDE SEARCH API..');
});

app.listen(5000, () =>
  console.log('EXPRESS Server Started at Port No: 5000'));
```

---

## GitHub Webhook Configuration

**Payload URL:** `http://<EC2_PUBLIC_IP>:8080/github-webhook/`

**Content Type:** `application/json`

**Trigger Events:**
- ✅ Push events
- ✅ Pull requests

**Active:** ✅

---

## Jenkins Configuration

### Install Plugins
- GitHub Integration
- GitHub Branch Source
- Pipeline
- Docker Pipeline
- NodeJS Plugin

### Global Tools
- **Git:** `/usr/bin/git`
- **Node.js:** Version 24.14.0
- **Docker:** Latest

### Credentials
- Store GitHub token
- Store Docker Hub credentials
- Store SSH keys

---

## Environment Variables

### In EC2
```bash
export NODE_ENV=production
export PORT=5000
export LOG_LEVEL=info
```

### In Docker
```dockerfile
ENV NODE_ENV=production
ENV PORT=5000
```

### In Jenkins Pipeline
```groovy
environment {
    NODE_ENV = 'production'
    PORT = '5000'
}
```

---

## Postman Testing Template

### GET Request
```
Method: GET
URL: http://<EC2_IP>:5000/search
Headers: None
Body: None
```

### POST Request
```
Method: POST
URL: http://<EC2_IP>:5000/login
Headers: Content-Type: application/json
Body: {
  "username": "test",
  "password": "test123"
}
```

### PUT Request
```
Method: PUT
URL: http://<EC2_IP>:5000/updateprofile
Headers: Content-Type: application/json
Body: {
  "name": "John Doe",
  "email": "john@example.com"
}
```

### DELETE Request
```
Method: DELETE
URL: http://<EC2_IP>:5000/del
Headers: None
Body: None
```

---

## Quick Verification Steps

1. **GitHub**
   - [ ] Repository created and public
   - [ ] Code pushed to main branch
   - [ ] Webhook configured and working

2. **EC2**
   - [ ] Instance running
   - [ ] Security groups allow ports 22, 8080, 5000
   - [ ] Can SSH into instance

3. **Jenkins**
   - [ ] Running on port 8080
   - [ ] Plugins installed
   - [ ] Pipeline created
   - [ ] Webhook trigger enabled

4. **Docker**
   - [ ] Installed on EC2
   - [ ] Jenkins user in docker group
   - [ ] Dockerfile in project

5. **API**
   - [ ] All endpoints accessible
   - [ ] Container running
   - [ ] Port 5000 open
   - [ ] Tested with Postman

---

## Support Commands

### Report System Info
```bash
# Check OS version
cat /etc/os-release

# Check Java version
java -version

# Check Docker version
docker --version

# Check Node.js version
node --version

# Check Jenkins version
curl -s http://localhost:8080 | grep "Jenkins"

# Check Git version
git --version
```

### Generate Report
```bash
# Create detailed system report
{
  echo "=== System Info ==="
  cat /etc/os-release
  echo ""
  echo "=== Docker ==="
  docker --version
  docker images
  docker ps
  echo ""
  echo "=== Jenkins ==="
  sudo systemctl status jenkins
  echo ""
  echo "=== Network ==="
  netstat -an | grep LISTEN
} > system-report.txt
```
