import json
import os
import boto3
from datetime import datetime, timedelta

def get_mock_data():
    """Returns realistic mock AWS billing data."""
    return [
        {"service": "Amazon Elastic Compute Cloud - Compute", "cost": 150.25},
        {"service": "Amazon Relational Database Service", "cost": 85.50},
        {"service": "Amazon Simple Storage Service", "cost": 12.30},
        {"service": "AWS Lambda", "cost": 5.45},
        {"service": "Amazon CloudFront", "cost": 3.20}
    ]

def lambda_handler(event, context):
    # Requirement 7: CORS headers for the React frontend
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }

    # Requirement 8: Fallback to mock data if deployed on a restricted Student Account
    use_mock_data = os.environ.get('USE_MOCK_DATA', '').lower() == 'true'

    if use_mock_data:
        data = get_mock_data()
        data = sorted(data, key=lambda x: x['cost'], reverse=True)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(data)
        }

    try:
        # Requirement 2: TimePeriod Last 30 days
        # Note: AWS Cost Explorer Start date is inclusive, End date is exclusive.
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=30)
        
        # Requirement 1: Use boto3
        ce = boto3.client('ce')
        
        response = ce.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='MONTHLY',  # Requirement 3
            Metrics=['UnblendedCost'],  # Requirement 4
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'SERVICE'  # Requirement 5
                }
            ]
        )
        
        # Aggregate costs by service
        # Since granularity is MONTHLY and time period spans 30 days, results may span across 2 calendar months
        service_costs = {}
        
        for result_by_time in response.get('ResultsByTime', []):
            for group in result_by_time.get('Groups', []):
                service_name = group['Keys'][0]
                cost_amount = float(group['Metrics']['UnblendedCost']['Amount'])
                
                # Requirement 6: Filter out $0.00 costs
                if cost_amount > 0:
                    if service_name in service_costs:
                        service_costs[service_name] += cost_amount
                    else:
                        service_costs[service_name] = cost_amount
                        
        # Format into a clean JSON array: [{"service": "AWS Lambda", "cost": 2.50}, ...]
        final_results = [
            {'service': service, 'cost': round(cost, 2)} 
            for service, cost in service_costs.items()
        ]
        
        # Sort array from highest cost to lowest
        final_results = sorted(final_results, key=lambda x: x['cost'], reverse=True)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(final_results)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
