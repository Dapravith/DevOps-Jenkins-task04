pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                echo 'Clone the Code from GitHub'
                git url: 'https://github.com/Dapravith/DevOps-Jenkins-task04.git', branch: 'main'
                echo 'Cloning Done'
            }
        }
        stage('Copy') {
            steps {
                echo 'Copy from Jenkin Working Directory To /home/ubuntu/proj Directory'
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
                docker build -t dapravith99/nodejs-api:v1.0 .
                '''
                echo 'Build Complete'
            }
        }
        stage('Run Image As Container') {
            steps {
                echo 'Start building container to Run'
                sh '''
                if lsofi 5000 -t >/dev/null; then
                   echo "Port 5000 is in use, killing process..."
                   sudo fuser -k 5000/tcp
                fi
 
                docker stop nodejsapi-container || true
                docker rm nodejsapi-container || true
                docker run --name nodejsapi-container -d -p 5000:5000 dapravith99/nodejsapi:v1.0
                '''
                echo 'NodeJS API running in a Container(docker)'
            }
        }
    }
    post{
        failure {
            echo 'Check Console Log for failure'
        }
        success{
            echo 'Deployment Success..APIs are running'
        }
    }
}