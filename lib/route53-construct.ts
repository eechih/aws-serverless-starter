import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

import config from './config'

export interface Route53ConstructProps {
  stageName: string
}

export class Route53Construct extends Construct {
  public readonly publicHostedZone?: route53.IHostedZone
  public readonly apiDomainName?: string
  public readonly apiCertificate?: certificatemanager.ICertificate

  constructor(scope: Construct, id: string, props: Route53ConstructProps) {
    super(scope, id)
    const { stageName } = props

    if (config.domainConfig) {
      const { nsDomain, domainPrefixes, apiCertificateArns } =
        config.domainConfig

      this.publicHostedZone = route53.HostedZone.fromLookup(
        this,
        'HostedZone',
        {
          domainName: nsDomain,
        }
      )

      this.apiDomainName = `api.${domainPrefixes[stageName]}${nsDomain}`

      const apiCertificateArn = apiCertificateArns[stageName]

      if (apiCertificateArn !== '') {
        this.apiCertificate = certificatemanager.Certificate.fromCertificateArn(
          this,
          'ApiCertificate',
          apiCertificateArn
        )
      } else {
        this.apiCertificate = new certificatemanager.Certificate(
          this,
          `ApiCertificate`,
          {
            domainName: this.apiDomainName,
            validation: certificatemanager.CertificateValidation.fromDns(
              this.publicHostedZone
            ),
          }
        )
      }
    }
  }
}
