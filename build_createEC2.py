from fintekkers.devops.aws_account_setup import (
    get_ec2_client,
    get_elb_client,
    get_load_balancer_arn,
    get_target_group_arn,
    get_security_group_id,
)
from botocore import client

import os
import time

os.environ["FINTEKKERS_DEFAULT_PORT"] = "443"
DEFAULT_PORT = int(os.environ["FINTEKKERS_DEFAULT_PORT"])
# Step 1: Set the key pair name
key_pair_name = "fintekkers-test-ec2"
ec2_client: client = get_ec2_client()

# Step 2: Launch an EC2 instance

image_id = "ami-0d8f91fa8ecdc3b58"  # Linux Amazon 2023
instance_type = "t4g.small"

# SSH security group
ssh_security_group_id = get_security_group_id("fintekkers-ec2-ssh")
# Default security group
security_group_id = get_security_group_id()


def create_instance() -> str:
    instance_id = None

    try:
        instance = ec2_client.run_instances(
            ImageId=image_id,
            InstanceType=instance_type,
            KeyName=key_pair_name,
            MaxCount=1,
            MinCount=1,
            NetworkInterfaces=[
                {
                    "AssociatePublicIpAddress": True,
                    "DeviceIndex": 0,
                    "SubnetId": "subnet-0d847b8f954f8631d",  # us-east-1a public
                    "Groups": [security_group_id, ssh_security_group_id],
                }
            ],
        )
        instance_id = instance["Instances"][0]["InstanceId"]
        print(f"Instance Created: {instance_id}")
    except ec2_client.exceptions.ClientError as e:
        print(f"Error launching instance: {e}")

    # Step 3: Create or Identify your Load Balancer
    # Assuming you have an existing Load Balancer and know its ARN
    load_balancer_arn = get_load_balancer_arn()

    # Step 4: Register the EC2 instance with the Load Balancer
    # Find the target group associated with your Load Balancer
    target_group_arn = get_target_group_arn(DEFAULT_PORT)

    def wait_for_instance_running(instance_id, timeout=300):
        """
        Wait for an EC2 instance to be in a running state.

        Parameters:
        - instance_id: The ID of the EC2 instance.
        - timeout: The maximum time to wait in seconds.
        """
        start_time = time.time()
        while True:
            # Check the elapsed time against the timeout
            if time.time() - start_time > timeout:
                print("Timed out waiting for instance to be in running state.")
                return False

            try:
                # Describe the instance to get the current state
                response = ec2_client.describe_instances(InstanceIds=[instance_id])
                state = response["Reservations"][0]["Instances"][0]["State"]["Name"]

                if state == "running":
                    print(f"Instance {instance_id} is now running.")
                    return True
                else:
                    print(f"Instance {instance_id} is in {state} state. Waiting...")
                    time.sleep(10)  # Wait for 10 seconds before checking again
            except Exception as e:
                print(f"Error checking instance state: {e}")
                return False

    # Call the wait function
    wait_for_instance_running(instance_id)

    # Register the instance
    try:
        register_response = get_elb_client().register_targets(
            TargetGroupArn=target_group_arn,
            Targets=[
                {
                    "Id": instance_id,
                },
            ],
        )
        print(f"Instance registered with Load Balancer: {register_response}")
    except ec2_client.exceptions.ClientError as e:
        print(f"Error registering instance with Load Balancer: {e}")

    return instance_id


if __name__ == "__main__":
    print(create_instance())
