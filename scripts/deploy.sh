#!/bin/bash

set -Eeuxo pipefail

sam deploy \
--stack-name ${APP_NAME}-${MODULE_NAME} \
            --capabilities CAPABILITY_IAM \
            --region ${REGION} \
            --resolve-s3 \
            --s3-prefix ${APP_NAME}-${MODULE_NAME} \
            --no-confirm-changeset \
            --no-fail-on-empty-changeset \
            --parameter-overrides Stage=${STAGE} 