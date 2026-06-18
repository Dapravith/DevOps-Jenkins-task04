pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {
        stage('Clone') {
            steps {
                echo 'Clone the Code from GitHub'
                git url: 'https://github.com/Dapravith/DevOps-Jenkins-task04.git', branch: 'main'
                echo 'Cloning Done'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Start building Docker Image'
                sh '''
                    docker build -t dapravith99/nodejs-api:v1.0 .
                '''
                echo 'Build Complete'
            }
        }

        stage('Run Image As Container') {
            steps {
                echo 'Start running container'
                sh '''
                    docker stop nodejsapi-container || true
                    docker rm nodejsapi-container || true

                    docker run --name nodejsapi-container -d -p 5000:5000 dapravith99/nodejs-api:v1.0
                '''
                echo 'NodeJS API running in Docker container'
            }
        }

        stage('Check Container') {
            steps {
                echo 'Checking running container'
                sh '''
                    docker ps
                    curl -f http://localhost:5000/search || exit 1
                '''
            }
        }
    }

    post {
        failure {
            echo 'Check Console Log for failure'
        }

        success {
            echo 'Deployment Success. APIs are running.'
        }
    }
}