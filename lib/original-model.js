// State and content are retained from the supplied original HTML.
class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; this.notify = () => {}; }
  setState(update) { Object.assign(this.state, typeof update === 'function' ? update(this.state, this.props) : update); this.notify(); }
  forceUpdate() { this.notify(); }
  closeNavigation() { if (this.state.mega) this.setState({ mega: false }); }
}
export default class OriginalModel extends DCLogic { renderVals() { return {}; } }
