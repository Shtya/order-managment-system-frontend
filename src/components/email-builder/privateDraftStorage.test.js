import { describe,it,expect } from "vitest";
import { clearPrivateDrafts } from "@/utils/privateDraftStorage";
describe("private draft cleanup",()=>{
  it("expires old drafts and clears every account's recovery on logout without touching unrelated state",()=>{
    sessionStorage.clear();
    sessionStorage.setItem("email-draft:tenant-a:user-a:new",JSON.stringify({expires:2000}));
    sessionStorage.setItem("email-draft:tenant-b:user-b:old",JSON.stringify({expires:500}));
    sessionStorage.setItem("unrelated","keep");
    clearPrivateDrafts(sessionStorage,true,1000);
    expect(sessionStorage.getItem("email-draft:tenant-b:user-b:old")).toBeNull();
    expect(sessionStorage.getItem("email-draft:tenant-a:user-a:new")).not.toBeNull();
    clearPrivateDrafts(sessionStorage);
    expect(sessionStorage.getItem("email-draft:tenant-a:user-a:new")).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
    sessionStorage.clear();
  });
});
