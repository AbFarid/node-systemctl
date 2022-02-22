# node-systemctl
Control your `systemd` services from the comfort of your NodeJS script, using this hacky interface module.

## Installation

```
npm i node-systemctl
```
or

```
yarn add node-systemctl
```

## Usage

Note: examples assume [ES6 modules enabled](https://www.geeksforgeeks.org/how-to-use-an-es6-import-in-node-js/).



### Quick start example
```js
import SystemService from 'node-systemctl'

// construct the service
// using await
const unit = await new SystemService('custom-unit')
if (!unit.isActive) await unit.start()

// or using .then()
new SystemService('custom-unit').then(async unit => {
  if (!unit.isActive) await unit.start()
})
```

If your service requires root privilages (or you are getting the `Interactive authentication required` error) pass a truthy value as the second argument:

```js
const superUnit = await new SystemService('custom-unit', true)
```

### Methods
Note: Following methods are async, use `await` if you need to wait for them to finish.

- `start()` - Actually `restart()` in disguise, see below.  
- `restart()` - Starts/restarts the service. Equivalent of `systemctl restart <service>`.  
- `stop()` - Stops the service. Equivalent of `systemctl stop <service>`.  
- `enable()` - Enables start at boot. Equivalent of `systemctl enable <service>`.  
- `disable()` - Disables start at boot. Equivalent of `systemctl disable <service>`.  
- `edit()` - Opens the unit file in an editor. Equivalent of `systemctl edit --full <service>`. (Only for use in a CLI environment)  

### Getters
- `isActive: boolean` - Returns `true` if the service is running, i.e., the following are both true:
  - service `ActiveState` is `active`
  - service `SubState` is `running`
- `isEnabled: boolean` - Returns `true` if service start at boot is enabled, i.e., `UnitFileState` is `enabled` or `static`.
- `status: string` - Returns service state as would be displayed in output of `systemctl status`. Ex.: `active (running)`
