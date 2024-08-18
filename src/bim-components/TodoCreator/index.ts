import * as OBC from "openbim-components"
import * as THREE from "three"
import { Todo } from "./Todo";

type ToDoPriority = "Low" | "Medium" | "High"

interface ToDo {
  description: string
  date: Date
  fragmentMap: OBC.FragmentIdMap
  camera: { position: THREE.Vector3, target: THREE.Vector3 }
  priority: ToDoPriority
}
2

export class TodoCreator extends OBC.Component<ToDo[]> implements OBC.UI, OBC.Disposable {
  static uuid = "abd7f95b-809f-46ca-a804-80cc5d2219ec"
  enabled = true
  onTodoCreated = new OBC.Event<ToDo>()
  uiElement = new OBC.UIElement<{
    activationButton: OBC.Button
    todoList: OBC.FloatingWindow
  }>()
  private _components: OBC.Components
  private _list: ToDo[] = []

  constructor(components: OBC.Components) {
    super(components)
    this._components = components
    components.tools.add(TodoCreator.uuid, this)
    this.setUI()
  }


  async dispose() {
    this.uiElement.dispose()
    this._list = []
    this.enabled = false
  }

  async setup() {
    const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
    highlighter.add(`${TodoCreator.uuid}-priority-Low`, [new THREE.MeshStandardMaterial({ color: 0x59bc59 })])
    highlighter.add(`${TodoCreator.uuid}-priority-Normal`, [new THREE.MeshStandardMaterial({color: 0x597cff})])
    highlighter.add(`${TodoCreator.uuid}-priority-High`, [new THREE.MeshStandardMaterial({ color: 0xff7676 })])
  }

  deleteTodo() {}

 async addTodo(description: string, priority: ToDoPriority) {
    if (!this.enabled) { return }
    
    const cameraToDo = new Todo(this.components)
    cameraToDo.skapaTodo(description, priority)

  } 
 

 
 async setUI() {
    const activationButton = new OBC.Button(this._components)
    activationButton.materialIcon = "construction"

    const newTodoBtn = new OBC.Button(this._components, { name: "Create" })
    activationButton.addChild(newTodoBtn)

    const form = new OBC.Modal(this._components)
    this._components.ui.add(form)
    form.title = "Create New ToDo"

    const descriptionInput = new OBC.TextArea(this._components)
    descriptionInput.label = "Description"
    form.slots.content.addChild(descriptionInput)

    const priorityDropdown = new OBC.Dropdown(this._components)
    priorityDropdown.label = "Priority"
    priorityDropdown.addOption("Low", "Normal", "High")
    priorityDropdown.value = "Normal"
    form.slots.content.addChild(priorityDropdown)

    form.slots.content.get().style.padding = "20px"
    form.slots.content.get().style.display = "flex"
    form.slots.content.get().style.flexDirection = "column"
    form.slots.content.get().style.rowGap = "20px"

    form.onAccept.add(() => {
      this.addTodo(descriptionInput.value, priorityDropdown.value as ToDoPriority)
      descriptionInput.value = "hej på dig"
      form.visible = false
      console.log()
    })
    
    form.onCancel.add(() => form.visible = false)

    newTodoBtn.onClick.add(() => form.visible = true)
    
    const todoList = new OBC.FloatingWindow(this._components)
    this._components.ui.add(todoList)
    todoList.visible = false
    todoList.title = "To-Do List"

    const todoListToolbar = new OBC.SimpleUIComponent(this._components)
    todoList.addChild(todoListToolbar)

    const colorizeBtn = new OBC.Button(this._components)
    colorizeBtn.materialIcon = "format_color_fill"
    todoListToolbar.addChild(colorizeBtn)

    const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
    colorizeBtn.onClick.add(() => {
      colorizeBtn.active = !colorizeBtn.active
      if (colorizeBtn.active) {
        for (const todo of this._list) {
          const fragmentMapLength = Object.keys(todo.fragmentMap).length
          if (fragmentMapLength === 0) {return}
          highlighter.highlightByID(`${TodoCreator.uuid}-priority-${todo.priority}`, todo.fragmentMap)
        }
      } else {
        highlighter.clear(`${TodoCreator.uuid}-priority-Low`) 
        highlighter.clear(`${TodoCreator.uuid}-priority-Normal`) 
        highlighter.clear(`${TodoCreator.uuid}-priority-High`)
      }
    })

    const todoListBtn = new OBC.Button(this._components, { name: "List" })
    activationButton.addChild(todoListBtn)
    todoListBtn.onClick.add(() => todoList.visible = !todoList.visible)
    
    this.uiElement.set({activationButton, todoList})
  } 

  get(): ToDo[] {
    return this._list
  }

}