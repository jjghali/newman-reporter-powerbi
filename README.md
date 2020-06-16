# newman-reporter-powerbi

## Description
Newman reporter for PowerBI

## Installation
```bash
$ npm install -g  git+https://git@github.com/jjghali/newman-reporter-powerbi.git
```
## Usage

```bash
$ newmman run /path/to/collection.json -r powerbi --reporter-powerbi-product <product-name> --reporter-powerbi-component <component-name> --reporter-powerbi-environment <env> --reporter-powerbi-powerbiURL <URL to API endpoint>
```
### CLI Option
| Option                                              | Description                              |
| --------------------------------------------------- | ---------------------------------------- |
| --reporter-powerbi-product <product-name>           | Specify name of the product              |
| --reporter-powerbi-component <component-name>       | Specify name of the component            |
| --reporter-powerbi-environment <env>                | Name of the environment (QA, DEV,PROD)   |
| --reporter-powerbi-powerbiURL <URL to API endpoint> | URL for the real-time dataset in PowerBI |
