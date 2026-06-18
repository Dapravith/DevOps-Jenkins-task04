# Jenkins Setup & Pipeline Configuration Guide

## Part 1: Jenkins Installation on EC2

### Prerequisites
- Ubuntu 22.04 LTS EC2 Instance
- 2GB RAM minimum (t2.micro may struggle)
- Java installed
- Port 8080 accessible

### Installation Steps

#### 1.1: Update System Packages
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install curl wget -y
```

#### 1.2: Install Java (Required)
```bash
# Check if Java is installed
java -version

# If not installed, install OpenJDK 11
sudo apt install openjdk-11-jdk -y

# Verify installation
java -version
```

**Expected Output:**
```
openjdk version "11.0.19" 2023-04-18
OpenJDK Runtime Environment (build 11.0.19+7-post-Ubuntu-0ubuntu0.22.04.1)
```

#### 1.3: Add Jenkins Repository
```bash
# Add Jenkins GPG key
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -

# Add Jenkins repository
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
```

#### 1.4: Install Jenkins
```bash
sudo apt update
sudo apt install jenkins -y
```

#### 1.5: Start & Enable Jenkins Service
```bash
# Start Jenkins
sudo systemctl start jenkins

# Enable Jenkins to start on boot
sudo systemctl enable jenkins

# Check status
sudo systemctl status jenkins
```

#### 1.6: Configure Firewall
```bash
# Allow Jenkins port
sudo ufw allow 8080/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

#### 1.7: Access Jenkins Web Interface
1. Open browser: `http://<EC2_PUBLIC_IP>:8080`
2. Get unlock key:
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
3. Paste the key into the web form
4. Install recommended plugins
5. Create first admin user

---

## Part 2: Jenkins Configuration for Pipeline

### 2.1: Install Required Plugins

1. Jenkins Dashboard → **Manage Jenkins** → **Manage Plugins**
2. Go to **Available** tab
3. Search and install:
   - GitHub Integration
   - GitHub Branch Source
   - Pipeline
   - Docker Pipeline
   - NodeJS Plugin
   - Git

4. Restart Jenkins:
```bash
sudo systemctl restart jenkins
```

### 2.2: Configure Global Tools

1. **Manage Jenkins** → **Global Tool Configuration**

#### Configure Git
- **Name:** Default
- **Path:** `/usr/bin/git` (or `git` for auto-detection)

#### Configure Node.js
- **Add NodeJS**
  - **Name:** Node 24.14.0
  - **Version:** 24.14.0
  - **Global npm packages to install:** (leave empty)

#### Configure Docker
- **Add Docker**
  - **Name:** Docker
  - **Installation root:** `/var/lib/jenkins/tools/docker`

---

## Part 3: Create Pipeline Job

### 3.1: Create New Pipeline Job

1. Jenkins Dashboard → **New Item**
2. **Enter item name:** `NodeJS-Docker-API-Pipeline`
3. **Select:** Pipeline
4. Click **OK**

### 3.2: Configure Pipeline - General Tab

1. **Description:**
```
Automated CI/CD pipeline for Food Express API
- Clones code from GitHub
- Builds Docker image
- Deploys container to EC2
```

2. **GitHub Project URL:**
```
https://github.com/<your-username>/jenkins
```

3. Check: **This project is parameterized** (optional)

### 3.3: Configure Pipeline - Build Triggers Tab

✅ **GitHub hook trigger for GITScm polling**
- This enables webhook triggering

✅ **Poll SCM** (optional fallback)
- Schedule: `H/5 * * * *` (every 5 minutes)

### 3.4: Configure Pipeline - Pipeline Tab

1. **Definition:** Pipeline script
2. **Pipeline Script:**

```groovy
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Clone') {
            steps {
                echo '============ STAGE 1: Cloning Code from GitHub ============'
                git url: 'https://github.com/<your-username>/jenkins.git', branch: 'main'
                echo '============ Clone Completed ============'
            }
        }

        stage('Copy Files') {
            steps {
                echo '============ STAGE 2: Copying Files to EC2 Directory ============'
                sh '''
                    echo "Creating directories..."
                    rm -rf /home/ubuntu/NodeAPI
                    mkdir -p /home/ubuntu/current
                    
                    echo "Copying from workspace..."
                    cp -r ${WORKSPACE}/NodeAPI /home/ubuntu/
                    cp -r ${WORKSPACE}/NodeAPI/* /home/ubuntu/current/
                    
                    echo "Files copied successfully"
                    ls -la /home/ubuntu/current/
                '''
                echo '============ Copy Completed ============'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '============ STAGE 3: Building Docker Image ============'
                sh '''
                    cd /home/ubuntu/current
                    echo "Building Docker image..."
                    docker build -t <dockerhub-username>/nodejsapi:v1.0 .
                    echo "Docker image built successfully"
                    docker images | grep nodejsapi
                '''
                echo '============ Build Completed ============'
            }
        }

        stage('Run Container') {
            steps {
                echo '============ STAGE 4: Running Docker Container ============'
                sh '''
                    echo "Stopping existing container..."
                    docker stop nodejsapi-container || true
                    docker rm nodejsapi-container || true
                    
                    echo "Checking if port 5000 is in use..."
                    if lsof -i :5000 -t >/dev/null 2>&1; then
                        echo "Killing process on port 5000..."
                        sudo fuser -k 5000/tcp || true
                    fi
                    
                    echo "Starting new container..."
                    docker run --name nodejsapi-container -d -p 5000:5000 <dockerhub-username>/nodejsapi:v1.0
                    
                    echo "Waiting for container to start..."
                    sleep 5
                    
                    echo "Container status:"
                    docker ps | grep nodejsapi
                '''
                echo '============ Container Started ============'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '============ STAGE 5: Verifying Deployment ============'
                sh '''
                    echo "Testing API endpoints..."
                    sleep 3
                    
                    echo "Testing /search endpoint..."
                    curl -s http://localhost:5000/search || echo "Failed to reach /search"
                    
                    echo "\nTesting /view endpoint..."
                    curl -s http://localhost:5000/view || echo "Failed to reach /view"
                    
                    echo "\n\nDeployment verification complete"
                '''
            }
        }
    }

    post {
        always {
            echo '============ Pipeline Execution Completed ============'
        }
        success {
            echo '✅ DEPLOYMENT SUCCESSFUL'
            echo 'APIs are running at http://<EC2_PUBLIC_IP>:5000'
        }
        failure {
            echo '❌ DEPLOYMENT FAILED'
            echo 'Check console logs for details'
            sh '''
                echo "Collecting debug information..."
                docker ps -a
                docker logs nodejsapi-container || true
            '''
        }
    }
}
```

3. Click **Save**

---

## Part 4: Configure GitHub Webhook

### 4.1: Get Jenkins Webhook URL

The webhook URL format is:
```
http://<EC2_PUBLIC_IP>:8080/github-webhook/
```

Example:
```
http://54.123.45.67:8080/github-webhook/
```

### 4.2: Add Webhook to GitHub Repository

1. Go to GitHub: `https://github.com/<username>/jenkins`
2. **Settings** → **Webhooks** → **Add webhook**
3. Configure webhook:
   - **Payload URL:** `http://<EC2_PUBLIC_IP>:8080/github-webhook/`
   - **Content type:** `application/json`
   - **Which events would you like to trigger this webhook?**
     - ✅ Push events
     - ✅ Pull requests
     - ✅ Pushes (if not Push events)
   - **Active:** ✅ Checked

4. Click **Add webhook**

### 4.3: Verify Webhook Connection

1. In GitHub webhook settings, scroll to **Recent Deliveries**
2. Should show successful delivery (green ✅)
3. Status code should be 200

---

## Part 5: Jenkins User Permissions

### 5.1: Add Jenkins User to Docker Group

```bash
# Add jenkins user to docker group (no password required)
sudo usermod -aG docker jenkins

# Add jenkins user to sudoers (with sudo privileges)
sudo usermod -aG sudo jenkins

# Allow docker commands without password prompt
sudo visudo
```

In the editor, add at the end:
```
jenkins ALL=(ALL) NOPASSWD: /usr/bin/docker
jenkins ALL=(ALL) NOPASSWD: /usr/bin/fuser
jenkins ALL=(ALL) NOPASSWD: /usr/sbin/fuser
```

Press `Ctrl+X`, `Y`, `Enter` to save.

### 5.2: Set Directory Permissions

```bash
# Set ownership of /home/ubuntu
sudo chown -R jenkins:jenkins /home/ubuntu

# Set permissions
sudo chmod -R 755 /home/ubuntu

# Create workspace directory if needed
sudo mkdir -p /home/ubuntu/workspace
sudo chown -R jenkins:jenkins /home/ubuntu/workspace
```

### 5.3: Verify Jenkins User Permissions

```bash
# Switch to jenkins user
sudo su - jenkins

# Test docker access
docker ps

# Exit back to ubuntu
exit
```

---

## Part 6: Test Pipeline

### 6.1: Manual Build

1. Jenkins Dashboard
2. Select **NodeJS-Docker-API-Pipeline**
3. Click **Build Now**
4. Monitor build progress in **Console Output**

### 6.2: Expected Output

```
============ STAGE 1: Cloning Code from GitHub ============
Cloning into workspace...
✓ Clone Completed

============ STAGE 2: Copying Files to EC2 Directory ============
Creating directories...
Copying from workspace...
✓ Copy Completed

============ STAGE 3: Building Docker Image ============
Building Docker image...
[+] Building 45.2s
✓ Build Completed

============ STAGE 4: Running Docker Container ============
Stopping existing container...
Starting new container...
✓ Container Started

============ STAGE 5: Verifying Deployment ============
Testing API endpoints...
✓ INSIDE SEARCH API..
✓ INSIDE VIEW API..

✅ DEPLOYMENT SUCCESSFUL
APIs are running at http://<EC2_PUBLIC_IP>:5000
```

### 6.3: Automatic Webhook Trigger

1. Make a change to code (e.g., update `index.js`)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update API"
   git push origin main
   ```
3. Check Jenkins - build should start automatically within 30 seconds

---

## Part 7: Jenkins System Configuration

### 7.1: Configure System Settings

1. **Manage Jenkins** → **Configure System**

#### System Message
```
Food Express - NodeJS API Pipeline
Environment: Production
```

#### Jenkins URL
```
http://<EC2_PUBLIC_IP>:8080/
```

#### Email Notification (Optional)
```
SMTP server: smtp.gmail.com
SMTP port: 587
Check: Use SMTP Authentication
Username: your-email@gmail.com
Password: your-app-password
```

### 7.2: Configure Security

1. **Manage Jenkins** → **Configure Global Security**
2. **Security Realm:** Jenkins' own user database
3. **Authorization:** Logged-in users can do anything
4. Check: **Prevent Cross Site Request Forgery attacks**

---

## Part 8: Jenkins Maintenance

### 8.1: Monitor Jenkins

```bash
# Check Jenkins service status
sudo systemctl status jenkins

# View Jenkins logs
sudo tail -f /var/log/jenkins/jenkins.log

# Check disk usage
df -h

# Check memory usage
free -h
```

### 8.2: Backup Jenkins Configuration

```bash
# Backup Jenkins home directory
sudo tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins

# Store backup
sudo mv jenkins-backup-*.tar.gz /home/ubuntu/backups/
```

### 8.3: Clean Up Old Builds

1. Jenkins Dashboard
2. Select job
3. **Configure** → **Advanced Project Options** → **Discard old builds**
4. Set **Max # of builds to keep:** 10

---

## Troubleshooting Jenkins

### Issue: Jenkins Won't Start

```bash
# Check logs
sudo tail -100 /var/log/jenkins/jenkins.log

# Restart service
sudo systemctl restart jenkins

# Check Java is installed
java -version
```

### Issue: Pipeline Fails at Clone Stage

```bash
# Test git access
git clone https://github.com/<username>/jenkins.git

# Check git is installed
git --version

# Reinstall git if needed
sudo apt install git -y
```

### Issue: Docker Commands Fail in Pipeline

```bash
# Verify jenkins user in docker group
id jenkins | grep docker

# Restart Jenkins for group membership to take effect
sudo systemctl restart jenkins

# Test docker command
sudo -u jenkins docker ps
```

### Issue: Webhook Not Triggering

1. Verify webhook URL: `http://<IP>:8080/github-webhook/`
2. Check GitHub webhook recent deliveries for errors
3. Verify EC2 security group allows HTTP (port 80)
4. Check Jenkins logs: `sudo tail -f /var/log/jenkins/jenkins.log`
5. Try polling SCM as fallback: `H/5 * * * *`

### Issue: Build Timeout

1. Increase timeout in pipeline script:
   ```groovy
   options {
       timeout(time: 60, unit: 'MINUTES')
   }
   ```

2. Or check what's taking long:
   ```bash
   docker images | grep nodejsapi
   du -sh /var/lib/docker
   ```

---

## Jenkins Security Best Practices

1. **Keep Jenkins Updated**
   ```bash
   sudo apt upgrade jenkins -y
   ```

2. **Use Strong Passwords**
   - Admin user should have strong password

3. **Restrict Network Access**
   - Only allow trusted IPs to Jenkins UI
   - Use security groups effectively

4. **Backup Regularly**
   ```bash
   sudo tar -czf jenkins-backup.tar.gz /var/lib/jenkins
   ```

5. **Monitor Logs**
   ```bash
   sudo tail -f /var/log/jenkins/jenkins.log
   ```

6. **Use SSH Keys for GitHub**
   - Add SSH key in Jenkins credentials
   - Use in pipeline: `ssh://git@github.com/username/repo.git`

---

## Advanced Configuration

### Using Jenkins Credentials for Docker Hub

1. **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. **Add Credentials**
   - Kind: Username with password
   - Username: Docker Hub username
   - Password: Docker Hub token
   - ID: `dockerhub-creds`

### Using in Pipeline

```groovy
withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
    sh 'docker push <username>/nodejsapi:v1.0'
}
```

---

## Performance Optimization

### Increase Jenkins Memory

```bash
# Edit Jenkins config
sudo nano /etc/default/jenkins

# Find JAVA_ARGS and modify
JAVA_ARGS="-Xmx1024m -Xms512m"

# Restart
sudo systemctl restart jenkins
```

### Enable Build Cache

```groovy
options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timestamps()
}
```

### Parallel Stages

```groovy
parallel {
    stage('Build') { ... }
    stage('Test') { ... }
}
```
