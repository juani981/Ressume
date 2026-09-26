import ActionMenuRoot from './ActionMenuRoot';
import DesignPanel from './DesignPanel';

const ActionMenu = ActionMenuRoot;
ActionMenu.Root = ActionMenuRoot;
ActionMenu.DesignPanel = DesignPanel;

export { ActionMenuRoot, DesignPanel };
export default ActionMenu;
