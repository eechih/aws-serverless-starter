import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { join } from 'path'

interface EmployeeProps {
  bucket: s3.IBucket
  graphqlApi: appsync.IGraphqlApi
}

export default class Employee extends Construct {
  constructor(scope: Construct, id: string, props: EmployeeProps) {
    super(scope, id)
    const { graphqlApi } = props

    const lambdaDir = join(__dirname, '..', 'packages', 'employee')

    const lambdaFunction = new nodejs.NodejsFunction(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: join(lambdaDir, 'src', 'index.ts'),
      depsLockFilePath: join(lambdaDir, 'package-lock.json'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
      },
    })

    props.bucket.grantRead(lambdaFunction)

    const lambdaDataSource = graphqlApi.addLambdaDataSource(
      'EmployeeLambdaDataSource',
      lambdaFunction
    )

    lambdaDataSource.createResolver('RandomEmployeesResolver', {
      typeName: 'Query',
      fieldName: 'randomEmployees',
    })
  }
}
