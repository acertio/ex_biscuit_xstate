import { assign, Machine } from "xstate";

function Open(form) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (form.verification === "OK") return resolve("Door Opened.");
  
        return reject("Door still Closed.");
      }, 1000);
    });
  }
export const stateMachine = Machine({
    initial: "idle",
    context: {
      msg: ""
    },
    states: {
      idle: {
        on: {
          SUBMIT: [
            {
              target: "loading",
              cond: (ctx, event) =>
                event.data.room_name !== "" && event.data.token !== ""
            },
            {
              target: "error"
            }
          ]
        }
      },
      loading: {
        invoke: {
          id: "doOpening",
          src: (ctx, event) => Open(event.data),
          onDone: {
            target: "success",
            actions: assign({ msg: (ctx, event) => event.data })
          },
          onError: {
            target: "error",
            actions: assign({ msg: (ctx, event) => event.data })
          }
        }
      },
      error: {
        on: {
          SUBMIT: {
            target: "loading",
            cond: (ctx, event) => event.data.room_name !== "" && event.data.token !== ""
          }
        }
      },
      success: {
        type: "final"
      }
    }
  });