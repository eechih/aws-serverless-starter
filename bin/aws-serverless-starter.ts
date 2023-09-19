#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsServerlessStarterStack } from '../lib/aws-serverless-starter-stack';

const app = new cdk.App();
new AwsServerlessStarterStack(app, 'AwsServerlessStarterStack');
