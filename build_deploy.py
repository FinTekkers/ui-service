import boto3

# get your instance ID from AWS dashboard
# instance_id = "i-07afe20ed103e6f14"


def deploy_code_to_instance(instance_id: str) -> bool:
    ec2 = boto3.resource("ec2", region_name="us-east-1")
    instance = ec2.Instance(id=instance_id)
    instance.wait_until_running()
    current_instance = list(ec2.instances.filter(InstanceIds=[instance_id]))
    ip_address = current_instance[0].public_ip_address

    import time
    import paramiko
    import os

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    def ssh_connect_with_retry(ssh, ip_address, retries):
        if retries > 3:
            return False
        privkey = paramiko.RSAKey.from_private_key_file(
            os.path.expanduser("~") + "/.aws/fintekkers-test-ec2.pem"
        )
        interval = 5
        try:
            retries += 1
            print("SSH into the instance: {}".format(ip_address))
            ssh.connect(hostname=ip_address, username="ec2-user", pkey=privkey)
            return True
        except Exception as e:
            print(e)
            time.sleep(interval)
            print("Retrying SSH connection to {}".format(ip_address))
            ssh_connect_with_retry(ssh, ip_address, retries)

    def execute_command(command: str):
        stdin, stdout, stderr = ssh.exec_command(command)
        print("stdout:", stdout.read())
        print("stderr:", stderr.read())

    commands = [
        "sudo yum install git -y",
        "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
        "source ~/.bashrc",
        "nvm install 21",
        # install make to be able to install npm packages
        "sudo yum install make -y",
        # test node is installed
        "node --version",
        # make node visible to sudo
        "sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.2/bin/node /usr/bin/node",
        "sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.2/bin/npm /usr/bin/npm",
        # Install pm2 which we will use to run web server on a daemon thread
        "sudo npm i -g pm2",
        "sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.2/bin/pm2 /usr/bin/pm2",
        # Clone code
        "git clone https://github.com/FinTekkers/ui-service",
        "chmod 777 ui-service",
        "cd ui-service",
        "pwd",
        "npm install",
        # Build the production server, the variables are required to build
        "GOOGLE_CLIENT_ID=MISSING GOOGLE_CLIENT_SECRET=MISSING npm run build",
        # Set the port to be 443. Note this is running HTTP server but running on HTTPS port.
        # The load balancer on AWS will add the encryption/certificate termination and forward
        # to this port. We could expose to port 80, but the broker is already using that port
        # Run the production server
        "sudo PORT=443 ORIGIN=* pm2 start ui-service/build/index.js",
    ]

    ssh_connect_with_retry(ssh, ip_address, 0)

    for command in commands:
        print("******* COMMAND: " + command)
        execute_command(command)

    return True


if __name__ == "__main__":
    from build_createEC2 import create_instance

    instance_id = create_instance()
    result = deploy_code_to_instance(instance_id)

    if result:
        print("Deployed successfully")
    else:
        print("Deployment failed")
