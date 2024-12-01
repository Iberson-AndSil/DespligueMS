resource "aws_ecs_cluster" "ecs_cluster" {
  name = "inventory-orders-cluster"
}

resource "aws_ecs_task_definition" "inventory_task" {
  family                = "inventory-service"
  network_mode          = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  container_definitions = jsonencode([{
    name      = "inventory-service"
    image     = "<aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/inventory-service:latest"
    memory    = 512
    cpu       = 256
    essential = true
    portMappings = [{
      containerPort = 8081
      hostPort      = 8081
      protocol      = "tcp"
    }]
  }])
}

resource "aws_ecs_task_definition" "orders_task" {
  family                = "orders-service"
  network_mode          = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  container_definitions = jsonencode([{
    name      = "orders-service"
    image     = "<aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/orders-service:latest"
    memory    = 512
    cpu       = 256
    essential = true
    portMappings = [{
      containerPort = 8082
      hostPort      = 8082
      protocol      = "tcp"
    }]
  }])
}

resource "aws_ecs_service" "inventory_service" {
  name            = "inventory-service"
  cluster         = aws_ecs_cluster.ecs_cluster.id
  task_definition = aws_ecs_task_definition.inventory_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = ["subnet-xxxxxxxx"]  # Subnet ID
    security_groups  = ["sg-xxxxxxxx"]     # Security Group ID
    assign_public_ip = true
  }
}

resource "aws_ecs_service" "orders_service" {
  name            = "orders-service"
  cluster         = aws_ecs_cluster.ecs_cluster.id
  task_definition = aws_ecs_task_definition.orders_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = ["subnet-xxxxxxxx"]  # Subnet ID
    security_groups  = ["sg-xxxxxxxx"]     # Security Group ID
    assign_public_ip = true
  }
}
