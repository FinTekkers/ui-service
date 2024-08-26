import os

os.environ['FINTEKKERS_DEFAULT_PORT'] = "443"
DEFAULT_PORT = "443"
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

if GOOGLE_CLIENT_ID is None:
    GOOGLE_CLIENT_ID="290113601275-gpvi7fd8o9c5ijna6olbondgr3mu83qt.apps.googleusercontent.com"

if GOOGLE_CLIENT_SECRET is None:
    GOOGLE_CLIENT_SECRET="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"

from time import sleep
import boto3
from fintekkers.devops.aws_account_setup import (
    get_ec2_client,
    get_elb_client,
    get_load_balancer_arn,
    get_target_group_arn,
    get_security_group_id,
)

from fintekkers.devops.build_createEC2 import create_instance, get_running_instance_ids

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
        # "sudo su",
        "sudo yum install git -y",
        'sudo yum groupinstall "Development Tools" -y',  # Required to install g++ which is required by some npm packages. This step will take a while
        "sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
        "source ~/.bashrc",
        "nvm install 21.6.1",  # Forcing 21.6.1, note its used in the links below
        # install make to be able to install npm packages
        "sudo yum install make -y",  ##Required sudo
        # test node is installed
        "node --version",
        # make node visible to sudo
        "sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.1/bin/node /usr/bin/node",
        "sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.1/bin/npm /usr/bin/npm",
        # Install pm2 which we will use to run web server on a daemon thread
        "npm i -g pm2",
        "sudo ln -s /home/ec2-user/.nvm/versions/node/v21.6.1/bin/pm2 /usr/bin/pm2",
        # Clone code
        "git clone https://github.com/FinTekkers/ui-service && sleep 10",
        "chmod 777 /home/ec2-user/ui-service",
        "pwd",
        "pwd",
        "cd /home/ec2-user/ui-service;npm install",
        # Build the production server, the variables are required to build
        # TEMP HACK TODO TODO TODO ###############"cd /home/ec2-user/ui-service;GOOGLE_CLIENT_ID=MISSING GOOGLE_CLIENT_SECRET=MISSING npm run build",
        # Set the port to be 443. Note this is running HTTP server but running on HTTPS port.
        # The load balancer on AWS will add the encryption/certificate termination and forward
        # to this port. We could expose to port 80, but the broker is already using that port
        # Run the production server
        'cd /home/ec2-user/ui-service;sudo PORT=443 ORIGIN=* pm2 start "GOOGLE_CLIENT_ID='
        + GOOGLE_CLIENT_ID
        + " GOOGLE_CLIENT_SECRET="
        + GOOGLE_CLIENT_SECRET
        + ' npm run dev"',  # Needs sudo to expose host; currently running dev because the build fails... unsure why!!!
    ]

    ssh_connect_with_retry(ssh, ip_address, 0)

    for command in commands:
        print("******* COMMAND: " + command)
        execute_command(command)

    return True


def teardown_old_ec2s(old_instance_ids):
    if old_instance_ids:
        # TODO: Deregister them first.

        stop_response = get_ec2_client().stop_instances(InstanceIds=old_instance_ids)
        stopping_instances = stop_response["StoppingInstances"]
        print(
            "Stopping instances:",
            [instance["InstanceId"] for instance in stopping_instances],
        )
    else:
        print("No instances to stop.")


def await_new_instance_on_target_group(new_instance_id):
    for i in range(
        10
    ):  # Currently the health check needs 5 consecutive seccesses to add to the load balancer (could swap this to read from AWS)
        target_group_arn = get_target_group_arn(DEFAULT_PORT)
        instances_ids = get_running_instance_ids(target_group_arn)

        if new_instance_id in instances_ids:
            # Meaning, the web server is healthy and serving traffic
            return
        else:
            sleep(
                30
            )  # Currently the web health check has an interval of 30 seconds (could swap this out to read that setting from AWS)

    raise Exception("New instance id is not registered with the load balancer")


def register_new_instange_to_load_balancer(new_instance_id):
    target_group_arn = get_target_group_arn(DEFAULT_PORT)

    # Register the instance
    register_response = get_elb_client().register_targets(
        TargetGroupArn=target_group_arn,
        Targets=[
            {
                "Id": new_instance_id,
            },
        ],
    )


if __name__ == "__main__":
    instance_id_map: map = create_instance()

    new_instance_id = instance_id_map["new_instance"]
    old_instance_ids = instance_id_map["old_instances"]
    result = deploy_code_to_instance(new_instance_id)

    if result:
        print("Deployed successfully. Tearing down old instances")
        #  Register the EC2 instance with the Load Balancer, then teardown old EC2 versions
        register_new_instange_to_load_balancer(new_instance_id)
        await_new_instance_on_target_group(new_instance_id)
        teardown_old_ec2s(old_instance_ids)
    else:
        print("Deployment failed")
