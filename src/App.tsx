import { useState, useEffect, useRef } from 'react'
import './App.css'

// notes: change arrived_at to assigned_at
// change columns from blue to white
// change treatment_type to treatment_type and make it dropdown
// treatment_types include 1. quick treat 2. multi drug 3. single drug 4. DTU
// color of treatment on nurse schedules are different based on treatment_types

const treatmentTypeColorMap : {[key: string]: string} = {
  QT: "#C9DF8A",
  SD: "#D2B4DE",
  MD: "#FFC0CB",
  DTU: "#7AC2E0",
}

interface Treatment {
  id: number,
  patient_name: string,
  arrived_at: string,
  treatment_type: string,
  complete_by: string,
  is_taken: boolean,
}

interface NurseSchedule {
  id: number,
  name: string,
  treatments: Array<Treatment>,
}

function App() {
  const [treatments, setTreatments] = useState<Array<Treatment>>([]);
  const [idTracker, setIdTracker] = useState(0);
  const [nurseSchedules, setNurseSchedules] = useState<Array<NurseSchedule>>(["A", "B", "C", "D", "E", "F"].map((nurse, index) => (
    {id: index, name: nurse, treatments: []}
  )));
  const ref = useRef(null);
  const [calendarHeight, setCalendarHeight] = useState(0);

  useEffect(()=> {
    if (ref.current) {
      setCalendarHeight(ref.current["clientHeight"]);
    }
  }, [])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const formData = new FormData(event.target as HTMLFormElement);
    const submittedTreatment = Object.fromEntries(formData);

    if (!submittedTreatment.patient_name) {
      alert("Please enter a valid patient name.");
      return;
    }
    else if (!submittedTreatment.arrived_at) {
      alert("Please enter a valid arrival time.");
      return;
    }
    else if (!submittedTreatment.treatment_type) {
      alert("Please enter a valid treatment_type level.");
      return;
    }
    else if (!submittedTreatment.complete_by) {
      alert("Please enter a valid estimated completion time.");
      return;
    }

    const treatment = {
      "id": idTracker,
      "patient_name": submittedTreatment.patient_name as string,
      "arrived_at": submittedTreatment.arrived_at as string,
      "treatment_type": submittedTreatment.treatment_type as string,
      "complete_by": submittedTreatment.complete_by as string,
      "is_taken": false,
    };
    setTreatments([...treatments, treatment]);
    setIdTracker(idTracker + 1);
  }

  function timeStringToNumber( time: string) {
    const a = time.split(":")
    return 60 * parseInt(a[0]) + parseInt(a[1]);
  }

  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.setData("text", (event.target as HTMLElement).id)
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const selectedTreatmentId = parseInt(event.dataTransfer.getData("text"));
    const copyNurseSchedules = [...nurseSchedules];
    const targetSchedule: NurseSchedule  = copyNurseSchedules.find(schedule => schedule.name === (event.target as HTMLElement).id)!;
    const copyTreatments = [...treatments]
    const targetTreatment = copyTreatments.find(treatment => treatment.id === selectedTreatmentId);
    targetSchedule.treatments = [...targetSchedule.treatments, targetTreatment!];
    targetSchedule.treatments.sort((x,y) => timeStringToNumber(x.arrived_at)-timeStringToNumber(y.arrived_at))
    setNurseSchedules(copyNurseSchedules);

    targetTreatment!.is_taken = true;
  }
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
  }

  function calculatePlacement(arrived_at: string) {
    // calendar shows 8AM to 8PM for a total of 12 hours
    // if 8AM, then 0px from the top
    // if 8PM, then 999px (entire height of calendar) from the top
    const startBoundary = timeStringToNumber("08:00");
    const endBoundary = timeStringToNumber("20:00");
    return Math.round(((timeStringToNumber(arrived_at) - startBoundary)/(endBoundary-startBoundary))*calendarHeight)
  }

  function calculateHeight(arrived_at: string, complete_by: string) {
    // returns a PERCENTAGE
    // if an event is from 8am-8pm, it takes up 100% height of the div
    const maxHeight = timeStringToNumber("12:00");
    return 100*(timeStringToNumber(complete_by)-timeStringToNumber(arrived_at))/maxHeight
  }

  // function removeFromSchedule(treatmentId: number, nurseScheduleId: number) {
  //   const copyNurseSchedules = [...nurseSchedules]
  //   const targetSchedule: NurseSchedule = copyNurseSchedules.find(schedule => schedule.id === nurseScheduleId)!;
  //   // const targetTreatment = targetSchedule.treatments.find(treatment => treatment.id === treatmentId)
  //   // debugger;
  //   targetSchedule.treatments = targetSchedule.treatments.filter(treatment => treatment.id !== treatmentId);
  //   setNurseSchedules(copyNurseSchedules);

  //   const copyTreatments = [...treatments]
  //   const targetTreatment = copyTreatments.find(treatment => treatment.id === treatmentId);
  //   targetTreatment!.is_taken = false;
  // }

  // function treatmentHasOverlap(treatmentId: number, nurseScheduleId: number) {
  //   const nurseSchedule = nurseSchedules.find(schedule => schedule.id === nurseScheduleId)!;
  //   const targetTreatment = nurseSchedule.treatments.find(treatment => treatment.id === treatmentId)!;
  //   const targetStartTime = timeStringToNumber(targetTreatment['arrived_at']);
  //   const targetEndTime = timeStringToNumber(targetTreatment['complete_by']);
  //   for (const treatment in nurseSchedule.treatments.filter(treatment => treatment.id !== treatmentId)) {
  //     const startTime = timeStringToNumber(treatment["arrived_at"])
  //     const endTime = timeStringToNumber(treatment["complete_by"])
  //     if ((targetStartTime <= startTime && targetEndTime >= endTime) || (targetStartTime <= startTime && targetEndTime <= endTime) || (targetStartTime >= startTime && targetEndTime >= endTime) || (targetStartTime >= startTime && targetEndTime <= endTime)) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  function removeFromTreatments(treatmentId: number) {
    setTreatments(treatments.filter(treatment => treatment.id !== treatmentId));
  }

  function handleClick(event: React.MouseEvent) {
    removeFromTreatments(parseInt((event.target as HTMLElement).getAttribute("treatment-id")!));
  }


  return (
    <>
      <h1 className="text-3xl font-bold underline">MishManage</h1>
      <br></br>
      <div className='flex flex-row'>
        <div id="treatments" className="">
          <h2 className="text-xl font-bold">Treatments</h2>
          <div className="space-y-4 flex flex-col">
            {treatments.filter((treatment) => !treatment.is_taken).map((treatment) => (
              <div className='bg-emerald-500 rounded-lg p-3 text-left' draggable="true" onDragStart={handleDragStart} key={treatment["id"]} id={String(treatment["id"])} style={{backgroundColor: treatmentTypeColorMap[treatment.treatment_type]}}>
                <button onClick={handleClick} className='float-right' treatment-id ={treatment["id"]} style={{backgroundColor: treatmentTypeColorMap[treatment["treatment_type"]]}}>x</button>
                <div className="p-1">Patient: {treatment["patient_name"]}</div>
                <div className="p-1">Arrived At:{treatment["arrived_at"]}</div>
                <div className="p-1">Treatment Type: {treatment["treatment_type"]}</div>
                <div className="p-1">Complete By: {treatment["complete_by"]}</div>
              </div>
            ))}
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <br></br>
              <label htmlFor="patient_name">Patient Name: </label>
              <input type="text" name="patient_name" id="patient_name"></input>
              <br></br>
              <label htmlFor="arrived_at">Patient Arrival Time: </label>
              <input type="time" name="arrived_at" id="arrived_at"></input>
              <br></br>
              <label htmlFor="treatment_type">Treatment Type: </label>
              {/* <input type='number' name="treatment_type" id="treatment_type" min="0" max="10"></input> */}
              <select id="treatment_type" name="treatment_type">
                <option value="QT">Quick Treat</option>
                <option value="SD">Single Drug</option>
                <option value="MD">Multi Drug</option>
                <option value="DTU">DTU</option>
              </select>
              <br></br>
              <label>Estimated Completion Time: </label>
              <input type="time" name="complete_by" id="complete_by" ></input>
              <br></br>
              <button type="submit">Add Treatment</button>
            </form>
          </div>
        </div>
        <div id="nurses" className="pl-4">
          <h2 className="text-xl font-bold">Nurses</h2>
          <div className='grid grid-cols-6 gap-x-[10px] px-4'>
            {nurseSchedules.map((nurseSchedule) => (
              <div key={nurseSchedule["id"]} className="rounded-lg h-screen w-32 font-bold static" onDragOver={handleDragOver} onDrop={handleDrop} style={{ backgroundColor: "#F9E79F"}}>
                <div>{nurseSchedule.name}</div>
                <div id={nurseSchedule.name} className="h-screen" ref={ref}>{nurseSchedule.treatments.map((treatment) => (
                  <div key={treatment["id"]} className='font-normal static rounded-lg text-left' style={{
                    fontSize:"10px",
                    fontWeight: "bold",
                    backgroundColor: treatmentTypeColorMap[treatment["treatment_type"]],
                    position: "relative",
                    top: `${calculatePlacement(treatment["arrived_at"])}px`,
                    height:`${calculateHeight(treatment["arrived_at"], treatment["complete_by"])}%`,
                    // zIndex: `${treatmentHasOverlap(treatment["id"], nurseSchedule["id"]) ? 1 : 0}`,
                  }}>
                    {/* <button onClick={handleClick} nursescheduleid={nurseSchedule["id"]} treatmentid={treatment["id"]} className="bg-fuchsia-500" style={{ top: "0px", float: "right", height: "30px", width: "10px", fontSize: "10px"}}>
                      <span style={{float: "right"}}>x</span>
                    </button> */}
                    <div className="p-1">{treatment["treatment_type"]}: {treatment["patient_name"]}</div>
                    {timeStringToNumber(treatment["complete_by"])-timeStringToNumber(treatment["arrived_at"]) > 15 && <div className='p-1'>{treatment["arrived_at"]}-{treatment["complete_by"]}</div>}
                    {/* <div className='p-1'>{treatment["arrived_at"]}-{treatment["complete_by"]}</div> */}
                    {/* <div className="p-1">{treatment["treatment_type"]}</div> */}
                  </div>
                ))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App

