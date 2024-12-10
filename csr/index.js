import Jasmine from "./jasmine";
import { convertHTMLToCreateElement } from "./utils";

class App extends Jasmine {
  $app;
  todoLists;
  vDom;

  constructor(app) {
    super();
    this.$app = app;
    this.setup();
    this.addEvents();
    this.todoLists = [];
    this.vDom;
  }

  template(children = "") {
    return `<div class="container">
    <div class="todolists__wrapper">
      <div class="todolists__title">
        <h2>TODO LIST</h2>
      </div>
      <button class="button" type="button" id="add__button">
        Add
      </button>
      <div class="todolists__content">${children}</div>
    </div>
  </div>`;
  }

  setup() {
    const domObj = convertHTMLToCreateElement(this.template());
    this.vDom = this.render(domObj);
    this.init(this.$app, this.vDom, domObj);
  }

  addEvents() {
    const $addTodoListButton = document.querySelector("#add__button");
    $addTodoListButton?.addEventListener("click", () => this.addTodoList());
  }

  redefineDom() {
    const renderedTemplate = this.template(
      this.todoLists
        .map((todolist) =>
          this.todoListView(todolist.title, todolist.subtitle, todolist.order)
        )
        .join("")
    );

    const newVDom = convertHTMLToCreateElement(renderedTemplate);

    this.reRender(this.vDom, newVDom);
  }

  addTodoList() {
    const dummyData = {
      order: this.todoLists?.length
        ? this.todoLists[this.todoLists.length - 1].order + 1
        : 0,
      title: "You can delete it",
      subtitle: "Edit via delete button",
    };

    this.todoLists = [...this.todoLists, dummyData];

    this.redefineDom();

    this.todoLists.forEach((todoList) => {
      const form = document.querySelector(`#form-${todoList.order}`);
      form?.addEventListener("submit", (e) =>
        this.editTodoList(e, todoList.order)
      );

      const deleteButton = document.querySelector(`#delete-${todoList.order}`);
      if (deleteButton) {
        deleteButton.addEventListener("click", () =>
          this.deleteTodoList(todoList.order)
        );
      }
    });
  }

  deleteTodoList(order) {
    this.todoLists = [...this.todoLists].filter(
      (todoList) => order !== todoList.order
    );

    this.redefineDom();
  }

  editTodoList(event, order) {
    event.preventDefault();

    const form = event.target;

    const data = new FormData(form);

    const dataObject = Object.fromEntries(data.entries());

    const title = dataObject.title;
    const subtitle = dataObject.subtitle;

    if (!title && !subtitle) return;

    this.todoLists = this.todoLists.map((todoList) => {
      if (todoList.order === order) {
        return { ...todoList, title, subtitle };
      }
      return todoList;
    });

    this.redefineDom();
  }

  todoListView(title, subtitle, order) {
    return `
      <form id="form-${order}" class="todolist">
          <div>
            <label class="checkbox path">
                <input type="checkbox" />
                <svg viewBox="0 0 21 21">
                    <path d="M5,10.75 L8.5,14.25 L19.4,2.3 C18.8333333,1.43333333 18.0333333,1 17,1 L4,1 C2.35,1 1,2.35 1,4 L1,17 C1,18.65 2.35,20 4,20 L17,20 C18.65,20 20,18.65 20,17 L20,7.99769186" />
                </svg>
            </label>
          </div>
          <div>
                <input
                    class="title"
                    placeholder=${title}
                    id="title"
                    name="title" 
                />
                <input
                    class="subtitle"
                    placeholder=${subtitle}
                    id="subtitle"
                    name="subtitle" 
                />
        </div>    
          <button type="submit" class='button'>Edit</button>
          <button type="button" id="delete-${order}" class='button'>Delete</button>
      </form>`;
  }
}

new App(document.querySelector("#app"));
