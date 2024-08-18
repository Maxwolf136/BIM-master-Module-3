import * as OBC from "openbim-components";
import * as THREE from "three";
import { v4 as uuidv4 } from 'uuid';
import { TodoCard } from "./src/TodoCard";
import { TodoCreator } from ".";

// 🤓 Challenge 1

type ToDoPriority = "Low" | "Medium" | "High"

interface IToDo {
    description: string
    date: Date
    fragmentMap: OBC.FragmentIdMap
    camera: { position: THREE.Vector3, target: THREE.Vector3 }
    priority: ToDoPriority
    uuid: string
  }

export class Todo extends OBC.Component<IToDo[]>{
    enabled: true;
    uuid = uuidv4()
    onTodoCreated = new OBC.Event<IToDo>()
    uiElement = new OBC.UIElement<{
      activationButton: OBC.Button
      todoList: OBC.FloatingWindow
    }>()
    private _components: OBC.Components
    private _list: IToDo[] = []

    constructor(components: OBC.Components) {
      super(components)
      this._components = components
      this.setUI()
      
    }

    async setup() {
      const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
      highlighter.add(`${this.uuid}-priority-Low`, [new THREE.MeshStandardMaterial({ color: 0x59bc59 })])
      highlighter.add(`${this.uuid}-priority-Normal`, [new THREE.MeshStandardMaterial({color: 0x597cff})])
      highlighter.add(`${this.uuid}-priority-High`, [new THREE.MeshStandardMaterial({ color: 0xff7676 })])
    }



    async skapaTodo (description:string, priority: ToDoPriority) {
        if(!this.enabled) return

        const camera = this._components.camera

        if(!(camera instanceof OBC.OrthoPerspectiveCamera)) {
            throw new Error("behöver kamera")
        }

        const position = new THREE.Vector3()
        camera.controls.getPosition(position);
        const target = new THREE.Vector3();
        camera.controls.getTarget(target);

        const todoCamera = {position, target}

        const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)

        const todoObject: IToDo = {
            uuid: uuidv4(),
            camera: todoCamera,
            description,
            date: new Date(),
            fragmentMap: highlighter.selection.select,
            priority

        }
        this._list.push(todoObject)

        //HTML Propertydata map
        const todoCardHTML = new TodoCard(this._components)
            todoCardHTML.description = todoObject.description
            todoCardHTML.date = todoObject.date
        
        //onCard Click(från OBC.events)
        todoCardHTML.onCardClick.add(() => {
            camera.controls.setLookAt(
                todoObject.camera.position.x,
                todoObject.camera.position.y,
                todoObject.camera.position.z,
                todoObject.camera.target.x,
                todoObject.camera.target.y,
                todoObject.camera.target.z,
                true
            )
            const fragmentMapLength = Object.keys(todoObject.fragmentMap).length
            if (fragmentMapLength === 0) return
            highlighter.highlightByID("select", todoObject.fragmentMap)
        })
        const todolist = this.uiElement.get("todoList")
        todolist.addChild(todoCardHTML)
        this.onTodoCreated.trigger(todoObject)

    }

   async setUI() {
    if (!this.components.ui) {
      throw new Error("UI Components not fed.");

    } else {
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
          this.skapaTodo(descriptionInput.value, priorityDropdown.value as ToDoPriority)
          descriptionInput.value = ""
          form.visible = false
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
              highlighter.highlightByID(`${this.uuid}-priority-${todo.priority}`, todo.fragmentMap)
            }
          } else {
            highlighter.clear(`${this.uuid}-priority-Low`) 
            highlighter.clear(`${this.uuid}-priority-Normal`) 
            highlighter.clear(`${this.uuid}-priority-High`)
          }
        })
    
        const todoListBtn = new OBC.Button(this._components, { name: "List" })
        activationButton.addChild(todoListBtn)
        todoListBtn.onClick.add(() => todoList.visible = !todoList.visible)
        
        this.uiElement.set({activationButton, todoList})
      }
   }

get(): IToDo[] {
    throw new Error("Method not implemented.");
}

}