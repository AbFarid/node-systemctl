import util from 'util'
import { exec as _exec, spawn } from 'child_process'
import { uncapitalize } from '../helper/utils.js'

const exec = util.promisify(_exec)

const errorHandler = error => {
  const { stderr, stdout, message, ...props } = error
  return { error: { message, ...props }, stderr, stdout }
}

// uncapitalize unit props where applicable, to match JS style
const uncapKey = key => 
  /^(CPU|IO|IP|NUMA|OOM|(G|U)ID)/.test(key) ? key : uncapitalize(key)

// TODO: add more types?
const parseValue = value => {
  // don't parse directory modes like '0775'
  if (/^0\d+$/.test(value)) return value
  else if (/^-?\d+$/.test(value)) return parseInt(value)
  if (value == 'yes') return true
  if (value == 'no') return false

  return value
}

export default class Service {
  
  name = ''
  cmd = ''
  props = {}
  
  constructor(serviceName, sudo = false) {
    this.name = serviceName
    this.cmd = `${sudo ? 'sudo ' : ''}systemctl`

    return this.#init()
  }

  async #init() {
    await this.#getProps()

    return this
  }

  async #getProps() {
    const { stderr, stdout, error } = await exec(`systemctl show --no-pager ${this.name}`)

    if (error) console.error(error.message)
    if (!stdout) console.error('No stdout :(')

    stdout.split('\n').forEach(prop => {
      if (!prop) return
      const [ key, ...value ] = prop.split('=')
      this.props[uncapKey(key)] = parseValue(value.join('='))
    })

    return this.props
  }

  async #waitForState(active, sub = '', timeout = 500) {
    if (!active) throw Error('Target state not specified.')
    const deadline = +new Date() + timeout

    while (+new Date() <= deadline) {
      let { activeState, subState } = this.props
  
      let activeMatch = active == activeState
      let subMatch = !sub || sub == subState
      if (activeMatch && subMatch) return true
      
      await this.#getProps()
    }

    throw Error('Timeout reached.')
  }


  get isActive() {
    const { activeState, subState } = this.props
    return activeState == 'active' && subState == 'running'
  }

  get isEnabled() {
    const { unitFileState } = this.props
    return unitFileState == 'enabled' || unitFileState == 'static'
  }

  get status() {
    const { activeState, subState } = this.props
    return `${activeState} (${subState})`
  }

  refresh = this.#getProps

  start = this.restart

  async restart() {
    const { stderr, stdout, error } = await exec(`${this.cmd} restart ${this.name}`)
      .catch(errorHandler)
    
    if (error) throw Error(error.message)
      
    await this.#getProps()
    return await this.#waitForState('active', 'running')
  }
  
  async stop() {
    const { stderr, stdout, error } = await exec(`${this.cmd} stop ${this.name}`)
      .catch(errorHandler)
    
    if (error) throw Error(error.message)
      
    await this.#getProps()
    return await this.#waitForState('inactive', 'dead')
  }

  async enable() {
    const { stderr, stdout, error } = await exec(`${this.cmd} enable ${this.name}`)
      .catch(errorHandler)
    
    if (error) throw Error(error.message)
      
    await this.#getProps()
    return true
  }

  async disable() {
    const { stderr, stdout, error } = await exec(`${this.cmd} disable ${this.name}`)
      .catch(errorHandler)
    
    if (error) throw Error(error.message)
    
    await this.#getProps()
    return true
  }
  
  async edit() {
    return new Promise(resolve => {
      const params = ['systemctl', 'edit', '--full', this.name]
      
      spawn('sudo', params, { stdio: 'inherit' })
        .on('close', code => resolve(code))
    })

  }
  
}