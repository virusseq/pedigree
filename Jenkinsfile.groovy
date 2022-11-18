/*
 * Copyright (c) 2022 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

String podSpec = '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:16
    tty: true
    securityContext:
      runAsUser: 1000
      runAsGroup: 1000
      fsGroup: 1000
  - name: dind-daemon
    image: docker:18.06-dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ''
    volumeMounts:
      - name: dind-storage
        mountPath: /var/lib/docker
  - name: docker
    image: docker:18-git
    command:
    - cat
    tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
    - name: HOME
      value: /home/jenkins/agent
    securityContext:
      runAsUser: 1000
      runAsGroup: 1000
      fsGroup: 1000
  volumes:
  - name: dind-storage
    emptyDir: {}
'''

pipeline {
  agent {
    kubernetes {
      yaml podSpec
    }
  }

  environment {
    appName = 'pedigree'
    dockerImgRepo = "ghcr.io/cancogen-virus-seq/${appName}"
    githubRepo = "cancogen-virus-seq/${appName}"

    commit = sh(
      returnStdout: true,
      script: 'git describe --always'
    ).trim()

    version = sh(
      returnStdout: true,
      script: 'cat ./package.json | ' +
        'grep "version" | ' +
        'cut -d : -f2 | ' +
        "sed \'s:[\",]::g\'"
    ).trim()
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
  }

  stages {
    stage('Build image') {
      steps {
        container('docker') {
          sh "docker build \
            --build-arg APP_COMMIT=${commit} \
            --build-arg APP_VERSION=${version} \
            --network=host \
            -f Dockerfile \
            -t portal:${commit} ."
        }
      }
    }

    stage('Publish images') {
      when {
        anyOf {
          branch 'develop'
          branch 'main'
          branch 'pedigree-containerized'
        }
      }
      steps {
        container('docker') {
          withCredentials([usernamePassword(
            credentialsId:'argoContainers',
            usernameVariable: 'USERNAME',
            passwordVariable: 'PASSWORD'
          )]) {
            sh 'docker login ghcr.io -u $USERNAME -p $PASSWORD'

            script {
              if (env.BRANCH_NAME ==~ /(main)/) { // push latest and version tags
                sh "docker tag portal:${commit} ${dockerImgRepo}:${version}"
                sh "docker push ${dockerImgRepo}:${version}"

                sh "docker tag portal:${commit} ${dockerImgRepo}:latest"
                sh "docker push ${dockerImgRepo}:latest"
              } else { //push commit tags
                sh "docker tag portal:${commit} ${dockerImgRepo}:${commit}"
                sh "docker push ${dockerImgRepo}:${commit}"
              }

              if (env.BRANCH_NAME ==~ /(develop)/) { //push edge tags
                sh "docker tag portal:${commit} ${dockerImgRepo}:edge"
                sh "docker push ${dockerImgRepo}:edge"
              }
            }
          }
        }
      }
    }

    stage('Publish Git Version Tag') {
      when {
        branch 'main'
      }
      steps {
        container('docker') {
          withCredentials([usernamePassword(
            credentialsId: 'argoGithub',
            passwordVariable: 'GIT_PASSWORD',
            usernameVariable: 'GIT_USERNAME'
          )]) {
            sh "git tag ${version}"
            sh "git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/${githubRepo} --tags"
          }
        }
      }
    }

    stage('Deploy to cancogen-virus-seq-dev') {
      when {
        anyOf {
          branch 'develop'
          branch 'pedigree-containerized'
        }
      }
      steps {
        script {
          // we don't want the build to be tagged as failed because it could not be deployed.
          try {
            build(job: 'virusseq/update-app-version', parameters: [
              [$class: 'StringParameterValue', name: 'CANCOGEN_ENV', value: 'dev' ],
              [$class: 'StringParameterValue', name: 'TARGET_RELEASE', value: "${appName}"],
              [$class: 'StringParameterValue', name: 'NEW_APP_VERSION', value: "${commit}" ],
              [$class: 'StringParameterValue', name: 'BUILD_BRANCH', value: env.BRANCH_NAME ]
            ])
          } catch (err) {
            echo 'The app built successfully, but could not be deployed'
          }
        }
      }
    }
  }
}
