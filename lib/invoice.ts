import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { join } from 'path'

interface InvoiceProps {
  graphqlApi: appsync.IGraphqlApi
}

export default class Invoice extends Construct {
  constructor(scope: Construct, id: string, props: InvoiceProps) {
    super(scope, id)
    const { graphqlApi } = props

    const lambdaDir = join(__dirname, '..', 'packages', 'invoice')

    const lambdaFunction = new nodejs.NodejsFunction(this, 'NodejsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: join(lambdaDir, 'src', 'index.ts'),
      depsLockFilePath: join(lambdaDir, 'package-lock.json'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
    })

    const lambdaDataSource = graphqlApi.addLambdaDataSource(
      'invoiceLambdaDataSource',
      lambdaFunction
    )

    lambdaDataSource.createResolver('createInvoiceResolver', {
      typeName: 'Mutation',
      fieldName: 'createInvoice',
    })

    lambdaDataSource.createResolver('deleteInvoiceResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteInvoice',
    })

    lambdaDataSource.createResolver('getInvoiceResolver', {
      typeName: 'Query',
      fieldName: 'getInvoice',
    })

    lambdaDataSource.createResolver('listInvoicesResolver', {
      typeName: 'Query',
      fieldName: 'listInvoices',
    })
  }
}
