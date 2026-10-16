var Ce=globalThis,Pe=Ce.ShadowRoot&&(Ce.ShadyCSS===void 0||Ce.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,tt=Symbol(),St=new WeakMap,pe=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==tt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Pe&&t===void 0){let r=e!==void 0&&e.length===1;r&&(t=St.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&St.set(e,t))}return t}toString(){return this.cssText}},kt=s=>new pe(typeof s=="string"?s:s+"",void 0,tt),rt=(s,...t)=>{let e=s.length===1?s[0]:t.reduce((r,n,i)=>r+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+s[i+1],s[0]);return new pe(e,s,tt)},At=(s,t)=>{if(Pe)s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let r=document.createElement("style"),n=Ce.litNonce;n!==void 0&&r.setAttribute("nonce",n),r.textContent=e.cssText,s.appendChild(r)}},nt=Pe?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let r of t.cssRules)e+=r.cssText;return kt(e)})(s):s;var{is:$r,defineProperty:Sr,getOwnPropertyDescriptor:kr,getOwnPropertyNames:Ar,getOwnPropertySymbols:Mr,getPrototypeOf:Er}=Object,Re=globalThis,Mt=Re.trustedTypes,Tr=Mt?Mt.emptyScript:"",Cr=Re.reactiveElementPolyfillSupport,me=(s,t)=>s,st={toAttribute(s,t){switch(t){case Boolean:s=s?Tr:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch{e=null}}return e}},Tt=(s,t)=>!$r(s,t),Et={attribute:!0,type:String,converter:st,reflect:!1,useDefault:!1,hasChanged:Tt};Symbol.metadata??=Symbol("metadata"),Re.litPropertyMetadata??=new WeakMap;var q=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Et){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let r=Symbol(),n=this.getPropertyDescriptor(t,r,e);n!==void 0&&Sr(this.prototype,t,n)}}static getPropertyDescriptor(t,e,r){let{get:n,set:i}=kr(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:n,set(o){let a=n?.call(this);i?.call(this,o),this.requestUpdate(t,a,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Et}static _$Ei(){if(this.hasOwnProperty(me("elementProperties")))return;let t=Er(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(me("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(me("properties"))){let e=this.properties,r=[...Ar(e),...Mr(e)];for(let n of r)this.createProperty(n,e[n])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[r,n]of e)this.elementProperties.set(r,n)}this._$Eh=new Map;for(let[e,r]of this.elementProperties){let n=this._$Eu(e,r);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let r=new Set(t.flat(1/0).reverse());for(let n of r)e.unshift(nt(n))}else t!==void 0&&e.push(nt(t));return e}static _$Eu(t,e){let r=e.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let r of e.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return At(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,r){this._$AK(t,r)}_$ET(t,e){let r=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,r);if(n!==void 0&&r.reflect===!0){let i=(r.converter?.toAttribute!==void 0?r.converter:st).toAttribute(e,r.type);this._$Em=t,i==null?this.removeAttribute(n):this.setAttribute(n,i),this._$Em=null}}_$AK(t,e){let r=this.constructor,n=r._$Eh.get(t);if(n!==void 0&&this._$Em!==n){let i=r.getPropertyOptions(n),o=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:st;this._$Em=n;let a=o.fromAttribute(e,i.type);this[n]=a??this._$Ej?.get(n)??a,this._$Em=null}}requestUpdate(t,e,r,n=!1,i){if(t!==void 0){let o=this.constructor;if(n===!1&&(i=this[t]),r??=o.getPropertyOptions(t),!((r.hasChanged??Tt)(i,e)||r.useDefault&&r.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,r))))return;this.C(t,e,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:r,reflect:n,wrapped:i},o){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),i!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(e=void 0),this._$AL.set(t,e)),n===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[n,i]of this._$Ep)this[n]=i;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[n,i]of r){let{wrapped:o}=i,a=this[n];o!==!0||this._$AL.has(n)||a===void 0||this.C(n,void 0,i,a)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(e)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};q.elementStyles=[],q.shadowRootOptions={mode:"open"},q[me("elementProperties")]=new Map,q[me("finalized")]=new Map,Cr?.({ReactiveElement:q}),(Re.reactiveElementVersions??=[]).push("2.1.2");var ot=globalThis,Ct=s=>s,Ge=ot.trustedTypes,Pt=Ge?Ge.createPolicy("lit-html",{createHTML:s=>s}):void 0,at="$lit$",W=`lit$${Math.random().toFixed(9).slice(2)}$`,lt="?"+W,Pr=`<${lt}>`,te=document,fe=()=>te.createComment(""),ye=s=>s===null||typeof s!="object"&&typeof s!="function",ct=Array.isArray,Nt=s=>ct(s)||typeof s?.[Symbol.iterator]=="function",it=`[ 	
\f\r]`,ge=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Rt=/-->/g,Gt=/>/g,X=RegExp(`>|${it}(?:([^\\s"'>=/]+)(${it}*=${it}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Dt=/'/g,Ht=/"/g,It=/^(?:script|style|textarea|title)$/i,ut=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),_=ut(1),x=ut(2),dn=ut(3),re=Symbol.for("lit-noChange"),y=Symbol.for("lit-nothing"),Ot=new WeakMap,ee=te.createTreeWalker(te,129);function Vt(s,t){if(!ct(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Pt!==void 0?Pt.createHTML(t):t}var Lt=(s,t)=>{let e=s.length-1,r=[],n,i=t===2?"<svg>":t===3?"<math>":"",o=ge;for(let a=0;a<e;a++){let l=s[a],u,d,h=-1,c=0;for(;c<l.length&&(o.lastIndex=c,d=o.exec(l),d!==null);)c=o.lastIndex,o===ge?d[1]==="!--"?o=Rt:d[1]!==void 0?o=Gt:d[2]!==void 0?(It.test(d[2])&&(n=RegExp("</"+d[2],"g")),o=X):d[3]!==void 0&&(o=X):o===X?d[0]===">"?(o=n??ge,h=-1):d[1]===void 0?h=-2:(h=o.lastIndex-d[2].length,u=d[1],o=d[3]===void 0?X:d[3]==='"'?Ht:Dt):o===Ht||o===Dt?o=X:o===Rt||o===Gt?o=ge:(o=X,n=void 0);let p=o===X&&s[a+1].startsWith("/>")?" ":"";i+=o===ge?l+Pr:h>=0?(r.push(u),l.slice(0,h)+at+l.slice(h)+W+p):l+W+(h===-2?a:p)}return[Vt(s,i+(s[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]},ve=class s{constructor({strings:t,_$litType$:e},r){let n;this.parts=[];let i=0,o=0,a=t.length-1,l=this.parts,[u,d]=Lt(t,e);if(this.el=s.createElement(u,r),ee.currentNode=this.el.content,e===2||e===3){let h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(n=ee.nextNode())!==null&&l.length<a;){if(n.nodeType===1){if(n.hasAttributes())for(let h of n.getAttributeNames())if(h.endsWith(at)){let c=d[o++],p=n.getAttribute(h).split(W),f=/([.?@])?(.*)/.exec(c);l.push({type:1,index:i,name:f[2],strings:p,ctor:f[1]==="."?He:f[1]==="?"?Oe:f[1]==="@"?Ne:se}),n.removeAttribute(h)}else h.startsWith(W)&&(l.push({type:6,index:i}),n.removeAttribute(h));if(It.test(n.tagName)){let h=n.textContent.split(W),c=h.length-1;if(c>0){n.textContent=Ge?Ge.emptyScript:"";for(let p=0;p<c;p++)n.append(h[p],fe()),ee.nextNode(),l.push({type:2,index:++i});n.append(h[c],fe())}}}else if(n.nodeType===8)if(n.data===lt)l.push({type:2,index:i});else{let h=-1;for(;(h=n.data.indexOf(W,h+1))!==-1;)l.push({type:7,index:i}),h+=W.length-1}i++}}static createElement(t,e){let r=te.createElement("template");return r.innerHTML=t,r}};function ne(s,t,e=s,r){if(t===re)return t;let n=r!==void 0?e._$Co?.[r]:e._$Cl,i=ye(t)?void 0:t._$litDirective$;return n?.constructor!==i&&(n?._$AO?.(!1),i===void 0?n=void 0:(n=new i(s),n._$AT(s,e,r)),r!==void 0?(e._$Co??=[])[r]=n:e._$Cl=n),n!==void 0&&(t=ne(s,n._$AS(s,t.values),n,r)),t}var De=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:r}=this._$AD,n=(t?.creationScope??te).importNode(e,!0);ee.currentNode=n;let i=ee.nextNode(),o=0,a=0,l=r[0];for(;l!==void 0;){if(o===l.index){let u;l.type===2?u=new ce(i,i.nextSibling,this,t):l.type===1?u=new l.ctor(i,l.name,l.strings,this,t):l.type===6&&(u=new Ie(i,this,t)),this._$AV.push(u),l=r[++a]}o!==l?.index&&(i=ee.nextNode(),o++)}return ee.currentNode=te,n}p(t){let e=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,e),e+=r.strings.length-2):r._$AI(t[e])),e++}},ce=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,r,n){this.type=2,this._$AH=y,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=r,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=ne(this,t,e),ye(t)?t===y||t==null||t===""?(this._$AH!==y&&this._$AR(),this._$AH=y):t!==this._$AH&&t!==re&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Nt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==y&&ye(this._$AH)?this._$AA.nextSibling.data=t:this.T(te.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:r}=t,n=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=ve.createElement(Vt(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===n)this._$AH.p(e);else{let i=new De(n,this),o=i.u(this.options);i.p(e),this.T(o),this._$AH=i}}_$AC(t){let e=Ot.get(t.strings);return e===void 0&&Ot.set(t.strings,e=new ve(t)),e}k(t){ct(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,r,n=0;for(let i of t)n===e.length?e.push(r=new s(this.O(fe()),this.O(fe()),this,this.options)):r=e[n],r._$AI(i),n++;n<e.length&&(this._$AR(r&&r._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let r=Ct(t).nextSibling;Ct(t).remove(),t=r}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},se=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,r,n,i){this.type=1,this._$AH=y,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=i,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=y}_$AI(t,e=this,r,n){let i=this.strings,o=!1;if(i===void 0)t=ne(this,t,e,0),o=!ye(t)||t!==this._$AH&&t!==re,o&&(this._$AH=t);else{let a=t,l,u;for(t=i[0],l=0;l<i.length-1;l++)u=ne(this,a[r+l],e,l),u===re&&(u=this._$AH[l]),o||=!ye(u)||u!==this._$AH[l],u===y?t=y:t!==y&&(t+=(u??"")+i[l+1]),this._$AH[l]=u}o&&!n&&this.j(t)}j(t){t===y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},He=class extends se{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===y?void 0:t}},Oe=class extends se{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==y)}},Ne=class extends se{constructor(t,e,r,n,i){super(t,e,r,n,i),this.type=5}_$AI(t,e=this){if((t=ne(this,t,e,0)??y)===re)return;let r=this._$AH,n=t===y&&r!==y||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,i=t!==y&&(r===y||n);n&&this.element.removeEventListener(this.name,this,r),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ie=class{constructor(t,e,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){ne(this,t)}},Ut={M:at,P:W,A:lt,C:1,L:Lt,R:De,D:Nt,V:ne,I:ce,H:se,N:Oe,U:Ne,B:He,F:Ie},Rr=ot.litHtmlPolyfillSupport;Rr?.(ve,ce),(ot.litHtmlVersions??=[]).push("3.3.3");var Ft=(s,t,e)=>{let r=e?.renderBefore??t,n=r._$litPart$;if(n===void 0){let i=e?.renderBefore??null;r._$litPart$=n=new ce(t.insertBefore(fe(),i),i,void 0,e??{})}return n._$AI(s),n};var ht=globalThis,K=class extends q{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Ft(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return re}};K._$litElement$=!0,K.finalized=!0,ht.litElementHydrateSupport?.({LitElement:K});var Gr=ht.litElementPolyfillSupport;Gr?.({LitElement:K});(ht.litElementVersions??=[]).push("4.2.2");var zt=s=>(...t)=>({_$litDirective$:s,values:t}),Ve=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,r){this._$Ct=t,this._$AM=e,this._$Ci=r}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var{I:Mn}=Ut;var Dr={},qt=(s,t=Dr)=>s._$AH=t;var Le=zt(class extends Ve{constructor(){super(...arguments),this.key=y}render(s,t){return this.key=s,t}update(s,[t,e]){return t!==this.key&&(qt(s),this.key=t),e}});var U={entity:{filter:[{domain:"sensor",device_class:"power"}]}},Wt={entity:{filter:[{domain:"sensor",device_class:"voltage"}]}},Ue={entity:{filter:[{domain:"sensor",device_class:"current"}]}},Bt={entity:{filter:[{domain:"sensor",device_class:"frequency"}]}},be={entity:{}},J=(s=1e5)=>({number:{min:0,max:s,step:1,mode:"box",unit_of_measurement:"W"}}),ue={boolean:{}},ie={text:{}},he=[{name:"tap_action",selector:{select:{mode:"dropdown",options:[{value:"more-info",label:"More info"},{value:"navigate",label:"Navigate"},{value:"none",label:"Nothing"}]}}},{name:"navigation_path",selector:ie}],Hr={title:"Title",update_interval:"Update interval",trend_window:"Trend window",power_unit:"Power unit",decimals:"Decimal places (kW)",max_power:"Full-speed flow power",max_devices:"Maximum devices shown",sort_devices:"Sort devices by load",show_other:"Show unmeasured load as a device",animation:"Animate power flow",hide_background:"Hide card background",cooldown_window:"Cooldown window",grid:"Utility (grid)",generator:"Generator",transfer_switch:"Transfer switch",home:"Home",solar:"Solar",battery:"Battery",devices:"High-draw devices",colors:"Colours",entity:"Power sensor",import_entity:"Import power sensor",export_entity:"Export power sensor",charge_entity:"Charge power sensor",discharge_entity:"Discharge power sensor",voltage:"Voltage sensor",current:"Current sensor",current_legs:"Per-leg current sensors",frequency:"Frequency sensor",status:"Status entity",outage_voltage:"Outage below voltage",invert:"Invert sign",threshold:"Idle below",name:"Name",running:"Running entity",fuel:"Fuel level sensor",rated_power:"Rated output",soc:"State of charge sensor",high_load:"Heavy load at",icon:"Icon",switch_entity:"Switch entity",tap_action:"Tap action",navigation_path:"Navigation path"},Or={update_interval:"Seconds between readout and trend refreshes. 0 updates live. Source changes always show immediately.",trend_window:"Minutes of load history in the trend strip. 0 hides it.",outage_voltage:"Used when no status entity is set. Measure voltage on the utility side of the transfer switch.",status:"On while utility power is present. Most reliable way to detect an outage.",running:"binary_sensor, or a status sensor such as Generac's (Running, Exercising, Cranking\u2026).",rated_power:"Enables the load gauge around the generator.",entity:"Positive = importing (grid) / discharging (battery).",cooldown_window:"Minutes after returning to utility during which a still-running generator is shown as cooling down rather than exercising. Default 5."};function jt(){return{schema:[{name:"title",selector:ie},{type:"grid",name:"",schema:[{name:"update_interval",selector:{number:{min:0,max:600,step:1,mode:"box",unit_of_measurement:"s"}}},{name:"trend_window",selector:{number:{min:0,max:1440,step:5,mode:"box",unit_of_measurement:"min"}}},{name:"power_unit",selector:{select:{mode:"dropdown",options:["auto","W","kW"]}}},{name:"decimals",selector:{number:{min:0,max:3,step:1,mode:"box"}}}]},{name:"grid",type:"expandable",flatten:!1,icon:"mdi:transmission-tower",schema:[{name:"entity",selector:U},{name:"status",selector:be},{type:"grid",name:"",schema:[{name:"voltage",selector:Wt},{name:"current",selector:Ue},{name:"frequency",selector:Bt},{name:"outage_voltage",selector:{number:{min:0,max:480,step:1,mode:"box",unit_of_measurement:"V"}}},{name:"name",selector:ie},{name:"threshold",selector:J(5e3)}]},{name:"current_legs",selector:{entity:{multiple:!0,filter:[{domain:"sensor",device_class:"current"}]}}},{name:"import_entity",selector:U},{name:"export_entity",selector:U},{name:"invert",selector:ue},...he]},{name:"generator",type:"expandable",flatten:!1,icon:"mdi:engine",schema:[{name:"entity",selector:U},{name:"running",selector:be},{type:"grid",name:"",schema:[{name:"voltage",selector:Wt},{name:"current",selector:Ue},{name:"frequency",selector:Bt},{name:"fuel",selector:{entity:{domain:"sensor"}}},{name:"rated_power",selector:J(2e5)},{name:"threshold",selector:J(5e3)},{name:"name",selector:ie},{name:"status",selector:be}]},{name:"current_legs",selector:{entity:{multiple:!0,filter:[{domain:"sensor",device_class:"current"}]}}},...he]},{name:"transfer_switch",type:"expandable",flatten:!1,icon:"mdi:electric-switch",schema:[{name:"entity",selector:be},...he]},{name:"home",type:"expandable",flatten:!1,icon:"mdi:home-lightning-bolt-outline",schema:[{name:"entity",selector:U},{name:"current",selector:Ue},...he]},{name:"solar",type:"expandable",flatten:!1,icon:"mdi:solar-power-variant",schema:[{name:"entity",selector:U},{type:"grid",name:"",schema:[{name:"name",selector:ie},{name:"threshold",selector:J(5e3)}]},...he]},{name:"battery",type:"expandable",flatten:!1,icon:"mdi:home-battery-outline",schema:[{name:"entity",selector:U},{name:"soc",selector:{entity:{filter:[{domain:"sensor",device_class:"battery"}]}}},{type:"grid",name:"",schema:[{name:"charge_entity",selector:U},{name:"discharge_entity",selector:U},{name:"name",selector:ie},{name:"threshold",selector:J(5e3)}]},{name:"invert",selector:ue},...he]},{name:"devices",selector:{object:{multiple:!0,label_field:"name",description_field:"entity",fields:{entity:{label:"Power sensor",required:!0,selector:U},name:{label:"Name",selector:ie},icon:{label:"Icon",selector:{icon:{}}},current:{label:"Current sensor",selector:Ue},threshold:{label:"Idle below (W)",selector:J(5e3)},high_load:{label:"Heavy load at (W)",selector:J()},switch_entity:{label:"Switch entity",selector:be}}}}},{name:"",type:"expandable",title:"Display",icon:"mdi:palette-outline",schema:[{type:"grid",name:"",schema:[{name:"max_devices",selector:{number:{min:1,max:12,step:1,mode:"box"}}},{name:"max_power",selector:J(2e5)},{name:"cooldown_window",selector:{number:{min:0,max:240,step:1,mode:"box",unit_of_measurement:"min"}}},{name:"sort_devices",selector:ue},{name:"show_other",selector:ue},{name:"animation",selector:ue},{name:"hide_background",selector:ue}]}]}],computeLabel:s=>s.title??Hr[s.name]??s.name,computeHelper:s=>Or[s.name]}}var T=s=>Math.round(s*100)/100,I=class{constructor(t,e){this.segs=[];this.start={x:t,y:e},this.cur={x:t,y:e}}lineTo(t,e){return this.segs.push({kind:"L",x:t,y:e}),this.cur={x:t,y:e},this}h(t){return this.lineTo(t,this.cur.y)}v(t){return this.lineTo(this.cur.x,t)}quadTo(t,e,r,n){return this.segs.push({kind:"Q",cx:t,cy:e,x:r,y:n}),this.cur={x:r,y:n},this}corner(t,e,r,n){let i=t-this.cur.x,o=e-this.cur.y,a=Math.hypot(i,o),l=r.x-t,u=r.y-e,d=Math.hypot(l,u),h=Math.min(n,a/2,d/2);return h<.5||a===0||d===0?this.lineTo(t,e):(this.lineTo(t-i/a*h,e-o/a*h),this.quadTo(t,e,t+l/d*h,e+u/d*h))}get end(){return{...this.cur}}toD(){let t=`M${T(this.start.x)} ${T(this.start.y)}`;for(let e of this.segs)t+=e.kind==="L"?`L${T(e.x)} ${T(e.y)}`:`Q${T(e.cx)} ${T(e.cy)} ${T(e.x)} ${T(e.y)}`;return t}sample(t=2){let e=[this.start.x],r=[this.start.y],n=this.start;for(let c of this.segs){if(c.kind==="L")e.push(c.x),r.push(c.y);else{let p=Math.hypot(c.cx-n.x,c.cy-n.y)+Math.hypot(c.x-c.cx,c.y-c.cy),f=Math.max(4,Math.ceil(p/1.5));for(let g=1;g<=f;g++){let m=g/f,b=(1-m)*(1-m),$=2*(1-m)*m,k=m*m;e.push(b*n.x+$*c.cx+k*c.x),r.push(b*n.y+$*c.cy+k*c.y)}}n={x:c.x,y:c.y}}let i=[0];for(let c=1;c<e.length;c++)i.push(i[c-1]+Math.hypot(e[c]-e[c-1],r[c]-r[c-1]));let o=i[i.length-1],a=Math.max(2,Math.floor(o/t)+1),l=o/(a-1)||0,u=new Float32Array(a),d=new Float32Array(a),h=0;for(let c=0;c<a;c++){let p=c*l;for(;h<i.length-2&&i[h+1]<p;)h++;let f=i[h+1]-i[h],g=f>0?Math.min(1,Math.max(0,(p-i[h])/f)):0,m=Math.min(h+1,e.length-1);u[c]=e[h]+(e[m]-e[h])*g,d[c]=r[h]+(r[m]-r[h])*g}return{length:o,step:l,xs:u,ys:d}}};function Fe(s,t,e={x:0,y:0}){let r=s.xs.length;if(r===0||s.step===0)return e.x=s.xs[0]??0,e.y=s.ys[0]??0,e;let i=Math.min(Math.max(t,0),s.length)/s.step,o=Math.min(Math.floor(i),r-2),a=i-o;return e.x=s.xs[o]+(s.xs[o+1]-s.xs[o])*a,e.y=s.ys[o]+(s.ys[o+1]-s.ys[o])*a,e}function Kt(s,t,e,r,n){let i=Math.min(n-r,359.99),o=(r-90)*Math.PI/180,a=(r+i-90)*Math.PI/180,l=s+e*Math.cos(o),u=t+e*Math.sin(o),d=s+e*Math.cos(a),h=t+e*Math.sin(a),c=i>180?1:0;return`M${T(l)} ${T(u)}A${T(e)} ${T(e)} 0 ${c} 1 ${T(d)} ${T(h)}`}var dt=(s,t,e)=>Math.min(e,Math.max(t,s));var Jt="http://www.w3.org/2000/svg",Nr=.618033988749895,pt=Math.PI*2,ze=class{constructor(t){this.layer=t;this.flows=new Map;this.raf=0;this.last=0;this.visible=!0;this.pt={x:0,y:0};this.frame=t=>{if(this.raf=0,!this.visible||this.flows.size===0)return;let e=Math.min(.05,Math.max(0,(t-this.last)/1e3));this.last=t;let r=t/1e3;for(let n of this.flows.values()){let{spec:i,dots:o}=n;n.speed+=(i.speed-n.speed)*Math.min(1,e*2.5);let a=n.speed,l=i.style==="engine";l&&(a*=1+.6*Math.sin(r*pt*1.6+n.seed));let u=n.offset;if(n.offset=(n.offset+a*e)%i.spacing,n.offset<u){n.colors.pop(),n.colors.unshift(this.pickColor(n));for(let c=0;c<o.length;c++)this.paint(n,c)}let d=i.samples.length,h=Math.min(10,d/4);for(let c=0;c<o.length;c++){let p=n.offset+c*i.spacing,f=o[c];if(p>d){f.setAttribute("r","0");continue}Fe(i.samples,i.direction===1?p:d-p,this.pt);let g=Math.min(p,d-p),m=h>0?Math.min(1,g/h):1,b=i.size;if(l){let $=Math.sin(r*pt*3.2+c*1.3+n.seed);b*=1+.18*$,m*=.85+.15*$}f.setAttribute("cx",this.pt.x.toFixed(1)),f.setAttribute("cy",this.pt.y.toFixed(1)),f.setAttribute("r",b.toFixed(2)),f.setAttribute("opacity",m.toFixed(2))}}this.raf=requestAnimationFrame(this.frame)}}get element(){return this.layer}update(t){let e=new Set;for(let r of t){e.add(r.id);let n=this.flows.get(r.id);if(n)n.spec.direction!==r.direction&&(n.colors=[]);else{let i=document.createElementNS(Jt,"g");i.setAttribute("data-flow",r.id),this.layer.appendChild(i),n={spec:r,group:i,dots:[],colors:[],offset:Math.random()*r.spacing,speed:r.speed,seed:Math.random()*pt,pick:Math.random()},this.flows.set(r.id,n)}n.spec=r,this.syncDots(n)}for(let[r,n]of this.flows)e.has(r)||(n.group.remove(),this.flows.delete(r));this.kick()}setVisible(t){this.visible=t,this.kick()}destroy(){cancelAnimationFrame(this.raf),this.raf=0;for(let t of this.flows.values())t.group.remove();this.flows.clear()}pickColor(t){let{colors:e,weights:r}=t.spec;if(e.length<=1)return e[0]??"currentColor";t.pick=(t.pick+Nr)%1;let n=r.reduce((o,a)=>o+a,0)||1,i=0;for(let o=0;o<e.length;o++)if(i+=r[o]/n,t.pick<i)return e[o];return e[e.length-1]}syncDots(t){let{spec:e}=t,r=Math.max(1,Math.ceil(e.samples.length/e.spacing));for(;t.dots.length<r;){let n=document.createElementNS(Jt,"circle");n.setAttribute("r","0"),n.setAttribute("stroke-opacity","0.28"),n.setAttribute("paint-order","stroke"),t.group.appendChild(n),t.dots.push(n)}for(;t.dots.length>r;)t.dots.pop().remove();for(;t.colors.length<r;)t.colors.push(this.pickColor(t));t.colors.length=r;for(let n=0;n<r;n++)this.paint(t,n)}paint(t,e){let r=t.dots[e],n=t.colors[e];r.setAttribute("fill",n),r.setAttribute("stroke",n),r.setAttribute("stroke-width",String(t.spec.size*1.9))}kick(){this.raf||!this.visible||this.flows.size===0||(this.last=performance.now(),this.raf=requestAnimationFrame(this.frame))}};function Zt(s,t){let e=Math.abs(s);if(e<=0)return 0;let r=50;return Math.min(1,Math.log10(1+e/r)/Math.log10(1+Math.max(t,1e3)/r))}var Ir={value:"\u2014",unit:""},Qt=new Map;function D(s,t,e){let r=`${e??""}|${t}`,n=Qt.get(r);if(!n){try{n=new Intl.NumberFormat(e,{minimumFractionDigits:t,maximumFractionDigits:t})}catch{n=new Intl.NumberFormat(void 0,{minimumFractionDigits:t,maximumFractionDigits:t})}Qt.set(r,n)}let i=Number(s.toFixed(t));return n.format(i===0?0:i)}function Yt(s,t="auto",e=1,r){if(s==null||!Number.isFinite(s))return Ir;let n=Math.abs(s);return t==="W"||t==="auto"&&n<1e3?{value:D(s,0,r),unit:"W"}:t==="kW"||n<1e6?{value:D(s/1e3,e,r),unit:"kW"}:{value:D(s/1e6,e,r),unit:"MW"}}function mt(s,t){return s==null?null:`${D(s,Math.abs(s)>=100||s===0?0:1,t)} V`}function _e(s,t,e=!1){return s==null?null:`${e?"\u2248":""}${D(s,Math.abs(s)>=100?0:1,t)} A`}function gt(s,t){return s==null?null:`${D(s,1,t)} Hz`}function qe(s){let t=Math.max(0,Math.floor(s/1e3)),e=Math.floor(t/86400),r=Math.floor(t%86400/3600),n=Math.floor(t%3600/60),i=t%60;return e>0?`${e}d ${r}h`:r>0?`${r}h ${String(n).padStart(2,"0")}m`:n>0?`${n}m ${String(i).padStart(2,"0")}s`:`${i}s`}function Xt(s){if(s<60)return`${s} min`;let t=s/60;return Number.isInteger(t)?`${t} h`:`${D(t,1)} h`}function We(s,t){try{return new Date(s).toLocaleTimeString(t,{hour:"numeric",minute:"2-digit"})}catch{return new Date(s).toLocaleTimeString()}}function er(s){return s.replace(/_/g," ").split(" ").map(t=>t&&t[0].toUpperCase()+t.slice(1)).join(" ")}function Be(s,t,e,r,n="glyph"){let i=e/24;return x`<g class=${n} transform="translate(${s-e/2} ${t-e/2}) scale(${i})">${r}</g>`}var ft=s=>x`
  <path d="M8 22 L11 3.5 H13 L16 22" />
  <path d="M5 7.5 H19 M6.6 12 H17.4" />
  <path d="M10.35 7.5 L14.38 12 M13.65 7.5 L9.62 12 M9.62 12 L15.27 17.5 M14.38 12 L8.73 17.5 M8.73 17.5 H15.27" class="thin" />
  <path d="M5 7.5 v2.2 M19 7.5 v2.2 M6.6 12 v2.2 M17.4 12 v2.2" class="thin" />
  ${s?x`<path class="slash-halo" d="M4 4 L20 20" /><path class="slash" d="M4 4 L20 20" />`:y}
`,yt=s=>x`
  <g class=${s?"rumble":""}>
    <rect x="2.8" y="8.2" width="18.4" height="10.8" rx="2.2" />
    <path d="M5.8 11.4 H11 M5.8 13.6 H11 M5.8 15.8 H11" class="thin" />
    <path d="M16.1 10.4 L14 14 H16.3 L14.9 17.3" class="bolt" />
    <path d="M17.2 8.2 V5.6 H19.8" />
    <path d="M6 19 V21 M18 19 V21" />
  </g>
  ${s?x`<g class="puffs">
          <circle class="puff" cx="20.2" cy="5.3" r="1.1" />
          <circle class="puff p2" cx="20.2" cy="5.3" r="1.1" />
          <circle class="puff p3" cx="20.2" cy="5.3" r="1.1" />
        </g>`:y}
`,tr=x`
  <path d="M2.8 11.4 L12 3.9 L21.2 11.4" />
  <path d="M5.6 9.4 V20.3 H18.4 V9.4" />
  <path d="M16.3 6.6 V4.2 H18.3 V8.3" class="thin" />
  <path d="M13.3 9.9 L9.7 15.1 H12.3 L10.9 19.3 L14.7 13.9 H12.1 Z" class="bolt-fill" />
`,rr=x`
  <circle cx="18.2" cy="5.2" r="2.2" />
  <path d="M18.2 1.2 V1.9 M22.2 5.2 H21.5 M21 2.4 L20.5 2.9 M15.4 2.4 L15.9 2.9 M21 8 L20.5 7.5" class="thin" />
  <path d="M2.6 20.6 L5.6 10.8 H16.4 L13.4 20.6 Z" />
  <path d="M4.1 15.7 H14.9 M9.6 10.8 L7.4 20.6 M13 10.8 L10.8 20.6" class="thin" />
`;function nr(s,t){let e=s===null?0:Math.min(100,Math.max(0,s))/100,r=13.4,n=r*e;return x`
    <rect x="7" y="4.6" width="10" height="17" rx="2" />
    <rect x="10" y="2.4" width="4" height="2.2" rx="0.8" class="solid" />
    ${n>.2?x`<rect class="level" x="8.8" y=${6.4+r-n} width="6.4" height=${n} rx="1" />`:y}
    ${t?x`<path d="M12.9 8.8 L10.6 13.2 H13.2 L11.3 17.6" class="charge" />`:y}
  `}var vt=x`
  <path d="M13.5 2 L7 13 H11.5 L9.5 22 L17 10 H12.5 Z" />
`;var sr=460,ir=200,Vr=82,Lr=12,or=(s,t=!1)=>s?Vr+(t?Lr:0):0;function ar(s,t=!1){return sr/(ir+or(s,t))}var Z=s=>({d:s.toD(),samples:s.sample(1.5)});function lr(s){let{w:t,h:e}=s,r=s.devices>0,n=or(r,s.deviceExtraLine),i=dt(Math.min(t/sr,e/(ir+n)),.62,1.3),o=8*i,a=21*i,l=35*i,u=9*i,d=n*i,h=e-d,c=s.grid&&s.generator,p=!c&&(s.grid||s.generator),f=o+a+2*i,g=o+a+2*i,m=s.solar?Math.max(h*.55,g+a+16*i+l):h*.5;m=Math.min(m,h-l-4*i);let b=24*i,$=42*i,k=f+a+14*i+b/2,M=c?k+b/2:p?f+a:o,E=t-o-a-4*i,w=s.battery?E-a:t-o,v=c||p?M+(w-M)*.5:t/2,P={home:{x:v,y:m,r:l}},H={},O={},N=null;if(c){let A=Math.max(40*i,Math.min(64*i,m-o-a,h-o-a-m)),C={x:f,y:m-A,r:a},j={x:f,y:m+A,r:a};P.grid=C,P.generator=j;let G={x:k-b*.18,y:m-$*.26},z={x:k-b*.18,y:m+$*.26},L={x:k+b*.22,y:m};N={x:k,y:m,w:b,h:$,pivot:L,utility:G,generator:z,bladeLen:Math.hypot(L.x-G.x,L.y-G.y),angle:Math.atan2(L.y-G.y,L.x-G.x)*180/Math.PI},H.grid=Z(new I(f,C.y+a).corner(f,G.y,G,u).lineTo(G.x,G.y)),H.generator=Z(new I(f,j.y-a).corner(f,z.y,z,u).lineTo(z.x,z.y)),H.feed=Z(new I(L.x,m).h(v-l));let Y=f+a+7*i;O.grid={x:Y,y:C.y,align:"left",anchor:"middle",maxWidth:Math.max(60*i,(s.solar?v-a-6*i:t-o)-Y)},O.generator={x:Y,y:j.y,align:"left",anchor:"middle",maxWidth:Math.max(60*i,v-8*i-Y)}}else if(p){let A=s.grid?"grid":"generator";P[A]={x:f,y:m,r:a},H[A]=Z(new I(f+a,m).h(v-l)),O[A]={x:f-a,y:m+a+5*i,align:"left",anchor:"top",maxWidth:Math.max(60*i,v-6*i-(f-a))}}if(s.solar){P.solar={x:v,y:g,r:a},H.solar=Z(new I(v,g+a).v(m-l));let A=v+a+7*i;O.solar={x:A,y:g,align:"left",anchor:"middle",maxWidth:Math.max(50*i,t-o-A)}}s.battery&&(P.battery={x:E,y:m,r:a},H.battery=Z(new I(E-a,m).h(v+l)),O.battery={x:E+a,y:m+a+5*i,align:"right",anchor:"top",maxWidth:Math.max(60*i,E+a-(v+l*.6))});let S=[],V=null,R=0;if(r){let A=h+6*i,C=14*i,j=A+14*i+C,G=t-2*o;R=Math.max(1,Math.floor(G/(56*i)));let z=Math.min(s.devices,R),L=Math.min(G/z,96*i),Y=L*z,wr=dt(v-Y/2,o,t-o-Y),$t=A-u;V=Z(new I(v,m+l).v($t));for(let Xe=0;Xe<z;Xe++){let le=wr+L*(Xe+.5),et=new I(v,$t);Math.abs(le-v)<1?et.v(j-C):et.corner(v,A,{x:le,y:A},u).corner(le,A,{x:le,y:j-C},u).lineTo(le,j-C),S.push({x:le,y:j,r:C,slot:L,wire:Z(et)})}}return{w:t,h:e,s:i,flowH:h,nodes:P,ats:N,wires:H,stem:V,devices:S,deviceCapacity:R,labels:O}}var Ur=new Set(["unavailable","unknown","none","","nan"]),cr=80,B=20,bt=10,Fr=["on","true","1","yes","online","connected","available","normal","ok","present","utility","grid"],zr=["off","false","0","no","offline","disconnected","outage","lost","fault","failed","failure"],qr=["on","true","1","yes","running","run","exercising","exercise","loaded","cranking","starting","warming up","warming","cooling down","cooldown"],Wr=["cranking","starting","start","warming up","warming","priming"],Br=["off","false","0","no","ready","standby","stopped","idle","auto","off/ready"],jr=["generator","gen","emergency","backup","standby","on","true","1"],Kr=["utility","normal","grid","mains","off","false","0"],Jr=["open","neutral","center","centre","none"],ke=s=>s.trim().toLowerCase().replace(/_/g," "),xe=(s,t)=>(s?.length?s:t).map(ke);function we(s){return!!s&&!Ur.has(ke(s.state))}function $e(s,t){if(!t)return null;let e=s(t);if(!we(e))return null;let r=Number(e.state);return Number.isFinite(r)?r:null}function ur(s){return String(s?.attributes?.unit_of_measurement??"").trim()}function Zr(s){switch(s){case"mW":return .001;case"MW":case"MVA":return 1e6;case"GW":return 1e9}let t=s.toLowerCase();return t==="kw"||t==="kva"?1e3:1}function _t(s,t,e){let r=$e(s,t);return r===null||!t?null:r*e(ur(s(t)))}var F=(s,t)=>_t(s,t,Zr),hr=s=>s.startsWith("m")?.001:s.startsWith("k")?1e3:1,Se=(s,t)=>_t(s,t,hr),dr=(s,t)=>_t(s,t,hr);function pr(s,t,e,r){if(!t)return null;let n=s(t);if(!we(n))return null;let i=ke(n.state);if(e.includes(i))return!0;if(r.includes(i))return!1;let o=Number(i);return Number.isFinite(o)?o>0:null}function mr(s,t){return(t??[]).map(e=>Se(s,e)).filter(e=>e!==null)}function Qr(s,t){let e;if(s.entity)e=F(t,s.entity);else if(s.import_entity||s.export_entity){let o=F(t,s.import_entity),a=F(t,s.export_entity);e=o===null&&a===null?null:Math.abs(o??0)-Math.abs(a??0)}else e=null;e!==null&&s.invert&&(e=-e);let r=dr(t,s.voltage),n=s.threshold??B,i=pr(t,s.status,Fr,zr);return i===null&&r!==null&&(i=r>=(s.outage_voltage??cr)),i===null&&e!==null&&Math.abs(e)>n&&(i=!0),{power:e,voltage:r,current:Se(t,s.current),currentEstimated:!1,legs:mr(t,s.current_legs),frequency:$e(t,s.frequency),available:i}}function Yr(s,t){let e=F(t,s.entity),r=dr(t,s.voltage),n=s.threshold??B,i=xe(s.starting_states,Wr),o=[...xe(s.running_states,qr),...i],a=pr(t,s.running,o,Br),l=s.running?t(s.running):void 0,u=!!l&&we(l)&&i.includes(ke(l.state));a===null&&(a=e!==null&&e>n||r!==null&&r>=cr);let d=null,h=$e(t,s.fuel);h!==null&&s.fuel&&(d={value:h,unit:ur(t(s.fuel))});let c=s.status?t(s.status):void 0,p=we(c)?c.state:null;return{power:e,voltage:r,current:Se(t,s.current),currentEstimated:!1,legs:mr(t,s.current_legs),frequency:$e(t,s.frequency),running:a,starting:u,statusText:p,fuel:d}}function Xr(s,t){if(!s?.entity)return null;let e=t(s.entity);if(!we(e))return null;let r=ke(e.state);return xe(s.generator_states,jr).includes(r)?"generator":xe(s.utility_states,Kr).includes(r)?"utility":xe(s.open_states,Jr).includes(r)?"open":null}function en(s,t,e){return t.power!==null&&t.power>e?"generator":t.starting?"utility":s.available===!1&&t.running&&t.power===null?"generator":"utility"}function tn(s,t){let e;if(s.entity)e=F(t,s.entity);else if(s.charge_entity||s.discharge_entity){let r=F(t,s.discharge_entity),n=F(t,s.charge_entity);e=r===null&&n===null?null:Math.abs(r??0)-Math.abs(n??0)}else e=null;return e!==null&&s.invert&&(e=-e),{power:e,soc:$e(t,s.soc)}}function rn(s){let t=[],e=s.grid;e&&t.push(e.entity,e.import_entity,e.export_entity,e.voltage,e.current,e.frequency,e.status,...e.current_legs??[]);let r=s.generator;r&&t.push(r.entity,r.voltage,r.current,r.frequency,r.running,r.status,r.fuel,...r.current_legs??[]),t.push(s.transfer_switch?.entity,s.home?.entity,s.home?.current,s.solar?.entity);let n=s.battery;n&&t.push(n.entity,n.charge_entity,n.discharge_entity,n.soc);for(let i of s.devices??[])t.push(i.entity,i.current,i.switch_entity);return t.filter(i=>!!i)}function xt(s){return[...new Set(rn(s))]}function je(s){let t=s.grid,e=s.generator,r=s.battery;return[...new Set([t?.entity,t?.import_entity,t?.export_entity,t?.voltage,t?.status,e?.entity,e?.voltage,e?.running,s.transfer_switch?.entity,s.home?.entity,s.solar?.entity,r?.entity,r?.charge_entity,r?.discharge_entity].filter(n=>!!n))]}var oe=s=>s!=null&&s>0?s:0;function Ke(s,t){let e=xt(s).filter(S=>!t(S)),r=s.grid?Qr(s.grid,t):null,n=s.generator?Yr(s.generator,t):null,i=s.solar?F(t,s.solar.entity):null,o=s.battery?tn(s.battery,t):null,a=F(t,s.home?.entity),l=s.generator?.threshold??B,u=null,d=!1;if(r&&n){let S=Xr(s.transfer_switch,t);d=S!==null,u=S??en(r,n,l)}let h=oe(i),c=o?.power??0,p=!!r&&r.available!==!1&&(u===null||u==="utility"),f=!!n&&(u===null||u==="generator"),g=p?r?.power??0:0,m=0;if(n&&f)if(n.power!==null)m=oe(n.power);else if(u==="generator"){let S=a!==null?a-h-c:r?.power??null;m=oe(S)}else n.running&&(m=oe(a!==null?a-h-c:null));let b=a!==null||r?.power!=null||n?.power!=null||i!==null||o?.power!=null,$=a??(b?Math.max(0,g+m+h+c):null),k=u==="generator"?n?.voltage??null:r?.available!==!1?r?.voltage??n?.voltage??null:null,M=(S,V)=>S!==null&&V!==null&&V>1?Math.abs(S)/V:null,E=Se(t,s.home?.current),w={power:$,current:E??M($,k),currentEstimated:E===null,voltage:k};r&&r.current===null&&r.legs.length===0&&p&&(r.current=M(r.power,r.voltage),r.currentEstimated=r.current!==null);let v=null;if(n){let S=s.generator?.rated_power;v={...n,supplying:m,loadPct:S&&S>0?m/S*100:null},v.current===null&&v.legs.length===0&&m>0&&(v.current=M(m,v.voltage),v.currentEstimated=v.current!==null)}let Q={grid:oe(g),generator:m,solar:h,battery:oe(c)},H={grid:p?g:0,generator:m,feed:u==="generator"?m:u==="utility"?g:0,solar:h,battery:c},O=(s.devices??[]).map((S,V)=>{let R=F(t,S.entity),A=S.threshold??bt,C=R!==null&&R>0&&R>=A;return{index:V,cfg:S,power:R,current:Se(t,S.current),active:C,high:C&&S.high_load!==void 0&&R>=S.high_load,share:C&&$&&$>0?Math.min(1,R/$):0,missing:!t(S.entity)}}),N=null;if(s.show_other&&$!==null){let S=O.reduce((V,R)=>V+oe(R.power),0);N=Math.max(0,$-S)}return{grid:r,generator:v,solar:s.solar?{power:i}:null,battery:o,ats:u,atsExplicit:d,home:w,supply:Q,flows:H,devices:O,other:N,phaseInputs:{hasGrid:!!r,hasGenerator:!!v,gridAvailable:r?.available??null,genRunning:v?.running??!1,genStarting:v?.starting??!1,ats:u},missing:e}}function Je(s){let t=null,e=0;for(let r of["grid","generator","battery","solar"])s[r]>e&&(t=r,e=s[r]);return t}function wt(s,t){return s.hasGenerator?s.hasGrid?s.ats==="generator"?s.gridAvailable===!0?"restored":"generator":s.gridAvailable===!1?s.genRunning||s.genStarting?"starting":"outage":s.genRunning?t?"cooldown":"exercise":"utility":s.genRunning?s.genStarting?"starting":"generator":"standby":s.gridAvailable===!1?"outage":"utility"}var Ae=["generator","restored"],Me=class{constructor(t){this.cooldownMs=t;this.state=null}get current(){return this.state}restore(t){t&&!this.state&&(this.state={...t})}observe(t,e,r){let n=this.state,i=n!==null&&(Ae.includes(n.phase)||n.phase==="cooldown"||n.lastGeneratorEnd!==null&&e-n.lastGeneratorEnd<this.cooldownMs),o=wt(t,i);if(n===null)return this.state={phase:o,since:r?.(o)??e,lastGeneratorEnd:null},{phase:o,since:this.state.since,previous:null,changed:!1};if(n.phase===o)return{phase:o,since:n.since,previous:n.phase,changed:!1};let a=Ae.includes(n.phase)&&!Ae.includes(o),l=n.phase==="cooldown"&&o!=="cooldown";return this.state={phase:o,since:e,lastGeneratorEnd:a?e:l?null:n.lastGeneratorEnd},{phase:o,since:e,previous:n.phase,changed:!0}}};function gr(s,t){if(s===null||s===t)return null;switch(t){case"outage":return{kind:"outage",title:"Utility power lost"};case"starting":return{kind:"generator",title:"Generator starting"};case"generator":return Ae.includes(s)?null:{kind:"generator",title:"Transferred to generator"};case"restored":return{kind:"utility",title:"Utility restored, retransfer pending"};case"cooldown":return{kind:"utility",title:"Back on utility, generator cooling down"};case"utility":return Ae.includes(s)?{kind:"utility",title:"Back on utility power"}:s==="exercise"?{kind:"info",title:"Generator exercise complete"}:s==="outage"||s==="starting"?{kind:"utility",title:"Utility power restored"}:null;case"exercise":return{kind:"info",title:"Generator exercise started"};case"standby":return s==="generator"?{kind:"info",title:"Generator stopped"}:null}}function Ze(s,t){switch(s){case"utility":return{label:"Utility power",tone:"grid",showDuration:!1};case"outage":return t?{label:"Outage \xB7 on battery",tone:"battery",showDuration:!0}:{label:"Power outage",tone:"outage",showDuration:!0};case"starting":return{label:"Generator starting",tone:"generator",showDuration:!0};case"generator":return{label:"On generator",tone:"generator",showDuration:!0};case"restored":return{label:"Utility restored",tone:"grid",showDuration:!0};case"cooldown":return{label:"Generator cooldown",tone:"grid",showDuration:!0};case"exercise":return{label:"Generator exercise",tone:"generator",showDuration:!0};case"standby":return{label:"Generator standby",tone:"neutral",showDuration:!1}}}var fr=rt`
  :host {
    display: block;
    height: 100%;
    --emc-text: var(--primary-text-color, #e6e8eb);
    --emc-muted: var(--secondary-text-color, #9aa1ab);
    --emc-bg: var(--ha-card-background, var(--card-background-color, #1c1d21));
    --emc-track: var(--secondary-text-color, #9aa1ab);
    --emc-line: var(--divider-color, rgba(127, 127, 127, 0.25));
  }

  ha-card {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 10px 12px 12px;
    overflow: hidden;
    position: relative;
  }

  ha-card.transparent {
    background: none;
    box-shadow: none;
    border: none;
  }

  /* ── Header ─────────────────────────────────────────────── */

  .header {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    min-height: 28px;
  }

  .title {
    flex: 1 1 auto;
    min-width: 6em;
    font-size: 15px;
    font-weight: 500;
    color: var(--emc-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 3px 11px 3px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 13%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 32%, transparent);
    transition: color 0.6s, background 0.6s, border-color 0.6s;
  }

  .pill .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--tone);
    flex: none;
  }

  .pill.alert .dot {
    animation: ping 1.3s ease-out infinite;
  }

  .pill .dur {
    font-weight: 500;
    opacity: 0.8;
    font-variant-numeric: tabular-nums;
  }

  .tone-grid { --tone: var(--emc-grid); }
  .tone-generator { --tone: var(--emc-generator); }
  .tone-outage { --tone: var(--emc-outage); }
  .tone-battery { --tone: var(--emc-battery); }
  .tone-solar { --tone: var(--emc-solar); }
  .tone-neutral { --tone: var(--emc-muted); }

  .banner {
    position: absolute;
    inset: -2px 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 15%, var(--emc-bg));
    border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
    animation: banner-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
    pointer-events: none;
  }

  .banner .what {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .banner .when {
    flex: none;
    margin-left: auto;
    font-weight: 500;
    opacity: 0.75;
    font-variant-numeric: tabular-nums;
  }

  .banner svg {
    width: 16px;
    height: 16px;
    flex: none;
  }

  .banner svg path {
    fill: currentColor;
  }

  /* ── Stage ──────────────────────────────────────────────── */

  .stage {
    position: relative;
    flex: 1 1 auto;
    width: 100%;
    min-height: 140px;
    max-height: 440px;
  }

  svg.diagram {
    position: absolute;
    inset: 0;
    overflow: visible;
  }

  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .overlay > * {
    pointer-events: auto;
  }

  /* Wires */

  .tracks {
    opacity: 0.22;
  }

  .tracks path,
  .live path,
  .devlive path {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .tracks path {
    stroke: var(--emc-track);
    stroke-width: calc(2px * var(--s));
  }

  .live path {
    stroke: var(--c);
    stroke-width: calc(2.4px * var(--s));
    opacity: 0.5;
    transition: stroke 0.8s ease, opacity 0.4s ease;
  }

  .live path.dead {
    stroke: var(--emc-outage);
    stroke-dasharray: calc(3px * var(--s)) calc(5px * var(--s));
    opacity: 0.75;
  }

  .devlive {
    opacity: 0.4;
  }

  .devlive path {
    stroke: var(--c);
    stroke-width: calc(2.2px * var(--s));
    transition: stroke 0.8s ease;
  }

  .fault {
    color: var(--emc-outage);
    animation: fault 1.6s steps(1) infinite;
  }

  .fault path {
    fill: currentColor;
    stroke: var(--emc-bg);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }

  /* Nodes */

  .node {
    cursor: pointer;
    color: var(--emc-muted);
    transition: color 0.5s ease;
  }

  .node:focus-visible {
    outline: none;
  }

  .node:focus-visible .disc {
    stroke: var(--emc-text);
    stroke-width: 2;
  }

  .node .disc {
    fill: var(--emc-bg);
  }

  .node .ring {
    fill: none;
    stroke: var(--c);
    stroke-width: calc(2.2px * var(--s));
    opacity: 0.32;
    transition: opacity 0.5s ease, stroke 0.6s ease;
  }

  .node .glow {
    opacity: 0;
    transition: opacity 0.8s ease;
  }

  .node.active,
  .node.running,
  .node.starting {
    color: var(--c);
  }

  .node.active .ring,
  .node.running .ring {
    opacity: 1;
  }

  .node.idle .ring {
    opacity: 0.55;
  }

  .node.active .glow {
    opacity: 1;
  }

  .node.down {
    color: var(--emc-outage);
  }

  .node.down .ring {
    stroke: var(--emc-outage);
    opacity: 0.9;
    stroke-dasharray: calc(4px * var(--s)) calc(3px * var(--s));
    animation: spin 9s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .node.starting .ring {
    opacity: 0.95;
    stroke-dasharray: calc(6px * var(--s)) calc(4px * var(--s));
    animation: spin 1.1s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .gauge-track {
    fill: none;
    stroke: var(--emc-track);
    stroke-opacity: 0.15;
  }

  .gauge {
    fill: none;
    stroke: var(--c);
    stroke-linecap: round;
    transition: stroke-dasharray 0.9s ease, stroke 0.6s ease;
  }

  .gauge.hot {
    stroke: var(--emc-outage);
  }

  .glyph path,
  .glyph rect,
  .glyph circle {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .glyph .thin {
    stroke-width: 1.1;
  }

  .glyph .solid,
  .glyph .bolt-fill,
  .glyph .level {
    fill: currentColor;
    stroke: none;
  }

  .glyph .level {
    opacity: 0.85;
  }

  .glyph .charge {
    stroke: var(--emc-bg);
    stroke-width: 1.4;
  }

  .glyph .slash {
    stroke-width: 1.8;
  }

  .glyph .slash-halo {
    stroke: var(--emc-bg);
    stroke-width: 4.2;
  }

  .rumble {
    animation: rumble 0.16s linear infinite;
  }

  .starting .rumble {
    animation-duration: 0.07s;
  }

  .glyph .puff {
    fill: currentColor;
    stroke: none;
    opacity: 0;
    animation: puff 1.8s ease-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .glyph .puff.p2 { animation-delay: 0.6s; }
  .glyph .puff.p3 { animation-delay: 1.2s; }

  /* Home */

  .home {
    color: var(--emc-text);
  }

  .home .ring-base {
    fill: none;
    stroke: var(--emc-track);
    stroke-opacity: 0.18;
  }

  .home .seg {
    fill: none;
    stroke-linecap: round;
    transition: stroke 0.8s ease;
  }

  .home.dark .ring-base {
    stroke: var(--emc-outage);
    stroke-opacity: 0.8;
    stroke-dasharray: calc(4px * var(--s)) calc(4px * var(--s));
  }

  .home.dark .glyph {
    opacity: 0.3;
  }

  .home .flicker {
    animation: flicker 1.5s steps(1) both;
  }

  .home-value {
    fill: var(--emc-text);
    font-weight: 700;
    text-anchor: middle;
    font-variant-numeric: tabular-nums;
  }

  .home-value .u {
    font-weight: 500;
    fill: var(--emc-muted);
  }

  .home-sub {
    fill: var(--emc-muted);
    text-anchor: middle;
    font-variant-numeric: tabular-nums;
  }

  /* Transfer switch */

  .ats-box {
    fill: var(--emc-bg);
    stroke: var(--emc-muted);
    stroke-opacity: 0.4;
  }

  .ats .contact {
    fill: var(--emc-bg);
    stroke: var(--emc-muted);
    stroke-opacity: 0.7;
    transition: fill 0.5s ease, stroke 0.5s ease;
  }

  .ats .contact.on {
    fill: var(--c);
    stroke: var(--c);
    stroke-opacity: 1;
  }

  .ats .blade {
    transition: transform 1s cubic-bezier(0.55, -0.4, 0.3, 1.5);
  }

  .ats .blade line {
    stroke: var(--c);
    stroke-linecap: round;
    transition: stroke 0.6s ease;
  }

  .ats .pivot {
    fill: var(--c);
    transition: fill 0.6s ease;
  }

  .ats-label {
    fill: var(--emc-muted);
    text-anchor: middle;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .spark {
    fill: none;
    stroke: var(--c);
    opacity: 0;
    animation: spark 0.75s ease-out 0.6s both;
    transform-box: fill-box;
    transform-origin: center;
  }

  /* Labels */

  .label {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: calc(1px * var(--s));
    line-height: 1.12;
    white-space: nowrap;
    cursor: pointer;
    color: var(--emc-text);
  }

  .label.mid {
    transform: translateY(-50%);
  }

  .label.right {
    align-items: flex-end;
    transform: translateX(-100%);
  }

  .label .name {
    display: flex;
    align-items: center;
    gap: calc(6px * var(--s));
    font-size: calc(10px * var(--s));
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--emc-muted);
  }

  .label .value {
    font-size: calc(17px * var(--s));
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }

  .label .value .unit {
    margin-left: 0.15em;
    font-size: 0.66em;
    font-weight: 500;
    color: var(--emc-muted);
  }

  .label .value .tag {
    margin-left: 0.4em;
    font-size: 0.6em;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--c);
  }

  .label .value.quiet {
    font-size: calc(14px * var(--s));
    font-weight: 600;
    color: var(--emc-muted);
  }

  .label .value.alarm {
    color: var(--emc-outage);
  }

  .label .value.accent {
    color: var(--c);
  }

  .label .detail {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.7em;
    font-size: calc(11px * var(--s));
    color: var(--emc-muted);
    font-variant-numeric: tabular-nums;
  }

  .label.right .detail {
    justify-content: flex-end;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0 5px;
    border-radius: 5px;
    font-size: calc(9.5px * var(--s));
    letter-spacing: 0.02em;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 14%, transparent);
  }

  .chip.low {
    --c: var(--emc-outage);
  }

  .warnmark {
    color: var(--warning-color, #ffa600);
  }

  /* Devices */

  .device {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
    cursor: pointer;
    text-align: center;
    /* Fixed so the label stack fits DEVICE_BAND whatever line-height the dashboard sets. */
    line-height: 1.2;
  }

  .dev-icon {
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--emc-muted);
    transition: color 0.5s ease;
  }

  .dev-icon ha-icon {
    --mdc-icon-size: calc(17px * var(--s));
    display: flex;
  }

  .device.active .dev-icon {
    color: var(--c);
  }

  .dev-value {
    margin-top: calc(5px * var(--s));
    font-size: calc(12px * var(--s));
    font-weight: 700;
    color: var(--emc-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .dev-value .unit {
    font-size: 0.8em;
    font-weight: 500;
    color: var(--emc-muted);
    margin-left: 1px;
  }

  .device:not(.active) .dev-value {
    font-weight: 500;
    color: var(--emc-muted);
  }

  .device.high .dev-value {
    color: var(--c);
  }

  .dev-name,
  .dev-amps {
    font-size: calc(10px * var(--s));
    color: var(--emc-muted);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dev-ring {
    fill: var(--emc-bg);
    stroke: var(--emc-track);
    stroke-opacity: 0.3;
  }

  .dev-share {
    fill: none;
    stroke: var(--c);
    stroke-linecap: round;
    transition: stroke-dasharray 0.8s ease, stroke 0.8s ease;
  }

  .dev-glow {
    opacity: 0;
    transition: opacity 0.6s ease;
  }

  .dev-glow.on {
    opacity: 1;
  }

  .more {
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 10px;
    color: var(--emc-muted);
  }

  /* ── Trend ──────────────────────────────────────────────── */

  .trend {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--emc-line);
  }

  .trend-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    font-size: 11px;
    color: var(--emc-muted);
  }

  .trend-head .grow {
    flex: 1 1 auto;
  }

  .trend-head b {
    color: var(--emc-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .trend-plot {
    position: relative;
    height: 40px;
    margin-top: 6px;
    touch-action: pan-y;
  }

  .trend-plot svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .trend-line {
    fill: none;
    stroke-width: 1.5;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .trend-base {
    stroke: var(--emc-track);
    stroke-opacity: 0.25;
    vector-effect: non-scaling-stroke;
  }

  .trend-dark {
    fill: var(--emc-outage);
    opacity: 0.22;
  }

  .trend-cursor {
    stroke: var(--emc-text);
    stroke-opacity: 0.45;
    vector-effect: non-scaling-stroke;
  }

  .trend-tip {
    position: absolute;
    top: -6px;
    transform: translate(-50%, -100%);
    padding: 3px 7px;
    border-radius: 6px;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    color: var(--emc-text);
    background: var(--emc-bg);
    border: 1px solid var(--emc-line);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    z-index: 3;
  }

  .trend-tip i,
  .legend i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 4px;
    border-radius: 2px;
    background: var(--c);
    vertical-align: -1px;
  }

  .trend-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 11px;
    color: var(--emc-muted);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    margin-top: 5px;
    font-size: 10.5px;
    color: var(--emc-muted);
  }

  .warn {
    margin-top: 6px;
    font-size: 11px;
    color: var(--warning-color, #ffa600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Motion ─────────────────────────────────────────────── */

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes ping {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tone) 70%, transparent); }
    100% { box-shadow: 0 0 0 7px transparent; }
  }

  @keyframes banner-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }

  @keyframes rumble {
    0% { transform: translate(0, 0); }
    25% { transform: translate(0.28px, -0.22px); }
    50% { transform: translate(-0.22px, 0.2px); }
    75% { transform: translate(0.2px, 0.18px); }
    100% { transform: translate(0, 0); }
  }

  @keyframes puff {
    0% { opacity: 0.55; transform: translate(0, 0) scale(0.6); }
    100% { opacity: 0; transform: translate(2.6px, -7px) scale(1.9); }
  }

  @keyframes spark {
    0% { opacity: 0; transform: scale(0.3); }
    15% { opacity: 1; }
    100% { opacity: 0; transform: scale(2.8); }
  }

  @keyframes flicker {
    0% { opacity: 1; }
    8% { opacity: 0.15; }
    14% { opacity: 1; }
    22% { opacity: 0.1; }
    34% { opacity: 0.8; }
    42% { opacity: 0.12; }
    60% { opacity: 0.45; }
    100% { opacity: 1; }
  }

  @keyframes fault {
    0% { opacity: 1; }
    6% { opacity: 0.2; }
    12% { opacity: 1; }
    50% { opacity: 1; }
    54% { opacity: 0.3; }
    58% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rumble,
    .glyph .puff,
    .node .ring,
    .pill .dot,
    .home .flicker,
    .fault,
    .spark,
    .banner {
      animation: none !important;
    }
    .ats .blade {
      transition: none;
    }
  }
`;var Ee=class{constructor(t,e=96){this.windowMs=t;this.count=e;this.buckets=new Map;this.bucketMs=t/e}add(t,e,r){let n=Math.floor(t/this.bucketMs),i=this.buckets.get(n);i||(i={sum:0,n:0,max:0,src:{}},this.buckets.set(n,i));let o=e===null?r==="none"?0:null:Math.max(0,e);o!==null&&(i.sum+=o,i.n+=1,i.max=Math.max(i.max,o)),i.src[r]=(i.src[r]??0)+1}prune(t){let e=Math.floor(t/this.bucketMs)-this.count;for(let r of this.buckets.keys())r<=e&&this.buckets.delete(r)}points(t){let e=Math.floor(t/this.bucketMs),r=[];for(let n=e-this.count+1;n<=e;n++){let i=this.buckets.get(n);if(!i||i.n===0){r.push(null);continue}let o="none",a=-1;for(let[l,u]of Object.entries(i.src))u>a&&(a=u,o=l);r.push({avg:i.sum/i.n,max:i.max,source:o})}return r}stats(t){let e=0,r=0,n=null,i=0,o=0;for(let a of this.points(t))a&&(e+=a.avg,r+=1,n=n===null?a.max:Math.max(n,a.max),a.source==="generator"&&(i+=this.bucketMs),a.source==="none"&&(o+=this.bucketMs));return{avg:r?e/r:null,peak:n,generatorMs:i,outageMs:o}}fillFrom(t){if(t.bucketMs===this.bucketMs)for(let[e,r]of t.buckets)this.buckets.has(e)||this.buckets.set(e,r)}get size(){return this.buckets.size}};async function yr(s,t,e,r){if(!s.callWS||t.length===0)return null;try{return await s.callWS({type:"history/history_during_period",start_time:new Date(e).toISOString(),end_time:new Date(r).toISOString(),entity_ids:t,minimal_response:!0,no_attributes:!0,significant_changes_only:!1})}catch{return null}}function vr(s,t,e,r,n,i){let o=new Map;for(let[u,d]of Object.entries(s)){let h=[],c=[];for(let p of d)h.push((p.lu??p.lc??0)*1e3),c.push(p.s);o.set(u,{times:h,states:c,i:-1})}let a=new Map,l=u=>{if(a.has(u))return a.get(u);let d=t(u),h=o.get(u),c=d?{...d,state:h&&h.i>=0?h.states[h.i]:"unavailable"}:void 0;return a.set(u,c),c};for(let u=e;u<=r;u+=n){for(let d of o.values())for(;d.i+1<d.times.length&&d.times[d.i+1]<=u;)d.i++;a.clear(),i(u,l)}}var nn="1.01",ae="energy-monitor-card",br={grid:"#4c9aff",generator:"#ff8a1f",solar:"#f5c400",battery:"#e05aa8",outage:"#ff4d4f"},Te=["grid","generator","solar","battery"],Qe={grid:"Utility",generator:"Generator",solar:"Solar",battery:"Battery",none:"Outage"};function de(s,t){if(!s)return!1;let e=s;return t.some(r=>Array.isArray(e[r])?e[r].length>0:!!e[r])}function sn(s){let t={...s};return de(t.grid,["entity","import_entity","export_entity","voltage","status","current","current_legs"])||delete t.grid,de(t.generator,["entity","running","voltage","current","current_legs"])||delete t.generator,de(t.transfer_switch,["entity"])||delete t.transfer_switch,de(t.home,["entity","current"])||delete t.home,de(t.solar,["entity"])||delete t.solar,de(t.battery,["entity","charge_entity","discharge_entity","soc"])||delete t.battery,t.devices=(t.devices??[]).filter(e=>e&&e.entity),t}function _r(s){let t=5381;for(let e=0;e<s.length;e++)t=(t<<5)+t+s.charCodeAt(e)|0;return(t>>>0).toString(36)}var Ye=class extends K{constructor(){super(...arguments);this._colors=br;this._tracker=new Me(30*6e4);this._trend=null;this._layout=null;this._layoutKey="";this._size={w:0,h:0};this._engine=null;this._flowsDirty=!0;this._inView=!0;this._banner=null;this._bannerSeq=0;this._cutover=0;this._lastAts=null;this._outageSeq=0;this._statusKey="";this._lastRefresh=0;this._historyRequested=!1;this._signature="";this._hoverIndex=null;this._uid=Math.random().toString(36).slice(2,8);this._reducedMotion=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;this._get=e=>this._hass?.states[e];this._onDocVisibility=()=>this._syncEngineVisibility();this._onTrendPointer=e=>{let n=e.currentTarget.getBoundingClientRect(),i=this._trend?.count??0;if(!i||n.width===0)return;let o=Math.min(i-1,Math.max(0,Math.floor((e.clientX-n.left)/n.width*i)));o!==this._hoverIndex&&(this._hoverIndex=o,this.requestUpdate())}}static getConfigForm(){return jt()}static getStubConfig(e){let r=e?.states??{},n=Object.keys(r),i=(a,l,u)=>n.find(d=>d.startsWith(`${a}.`)&&u.test(d)&&(l===null||r[d]?.attributes?.device_class===l)),o={type:`custom:${ae}`,grid:{entity:i("sensor","power",/grid|mains|utility|import/)??"sensor.grid_power",voltage:i("sensor","voltage",/grid|mains|utility|line/)},generator:{entity:i("sensor","power",/generator|genset/)??"sensor.generator_power",running:i("binary_sensor",null,/generator/)??i("sensor",null,/generator.*(status|state)/)}};for(let a of[o.grid,o.generator])for(let l of Object.keys(a))a[l]===void 0&&delete a[l];return o}setConfig(e){if(!e||typeof e!="object")throw new Error("Invalid configuration");if(e.devices!==void 0&&!Array.isArray(e.devices))throw new Error("`devices` must be a list");let r=sn(e);if(!r.grid&&!r.generator&&!r.solar&&!r.battery&&!r.home)throw new Error("Add at least one of: grid, generator, solar, battery or home (each with an entity)");this._config=r,this._colors={...br,...r.colors??{}};let n=r.trend_window??60,i=JSON.stringify([je(r),n,r.cooldown_window,r.grid?.invert,r.grid?.outage_voltage,r.grid?.threshold,r.generator?.threshold,r.generator?.running_states,r.generator?.starting_states,r.transfer_switch?.generator_states,r.transfer_switch?.utility_states,r.transfer_switch?.open_states,r.battery?.invert]);i!==this._signature&&(this._signature=i,this._tracker=new Me(this._cooldownMs),this._trend=n>0?new Ee(n*6e4):null,this._historyRequested=!1,this._phase=void 0,this._lastAts=null),this._snap=void 0,this._statusKey="",this._layoutKey="",this._flowsDirty=!0,this.isConnected&&this._startTimers(),this._hass&&(this.hass=this._hass)}set hass(e){if(this._hass=e,!this._config)return;let r=Ke(this._config,this._get),n=JSON.stringify(r.phaseInputs),i=this._intervalMs,o=i===0||Date.now()-this._lastRefresh>=i;(!this._snap||n!==this._statusKey||o)&&this._apply(r,n),!this._historyRequested&&this._trend&&this._loadHistory()}get hass(){return this._hass}getCardSize(){let e=this._config;return 5+((e?.devices?.length??0)>0||!!e?.show_other?1:0)+(this._trend?2:0)}getGridOptions(){let e=this._config,r=(e?.devices?.length??0)>0||!!e?.show_other,n=(e?.trend_window??60)>0,i=4+(r?1:0)+(n?1:0);return{columns:12,rows:i,min_columns:6,min_rows:Math.max(3,i-2)}}connectedCallback(){super.connectedCallback(),this._startTimers(),this.requestUpdate(),document.addEventListener("visibilitychange",this._onDocVisibility),typeof IntersectionObserver=="function"&&(this._intersectionObserver=new IntersectionObserver(e=>{this._inView=e.some(r=>r.isIntersecting),this._syncEngineVisibility()}),this._intersectionObserver.observe(this))}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this._refreshTimer),clearInterval(this._clockTimer),clearTimeout(this._bannerTimer),document.removeEventListener("visibilitychange",this._onDocVisibility),this._intersectionObserver?.disconnect(),this._resizeObserver?.disconnect(),this._resizeObserver=void 0,this._engine?.destroy(),this._engine=null,this._flowsDirty=!0}updated(){let e=this.renderRoot.querySelector(".stage");e&&!this._resizeObserver&&typeof ResizeObserver=="function"&&(this._resizeObserver=new ResizeObserver(n=>{let i=n[0]?.contentRect;if(!i)return;let o=Math.round(i.width),a=Math.round(i.height);(o!==this._size.w||a!==this._size.h)&&(this._size={w:o,h:a},this.requestUpdate())}),this._resizeObserver.observe(e));let r=this.renderRoot.querySelector("g.particles");if(!r){this._engine?.destroy(),this._engine=null;return}(!this._engine||this._engine.element!==r)&&(this._engine?.destroy(),this._engine=new ze(r),this._flowsDirty=!0,this._syncEngineVisibility()),this._flowsDirty&&(this._flowsDirty=!1,this._engine.update(this._animated?this._flowSpecs():[]))}get _intervalMs(){let e=this._config?.update_interval??2;return Math.max(0,e)*1e3}get _cooldownMs(){return Math.max(0,this._config?.cooldown_window??5)*6e4}get _animated(){return this._config?.animation!==!1&&!this._reducedMotion}get _locale(){return this._hass?.locale?.language??this._hass?.language}_startTimers(){clearInterval(this._refreshTimer),clearInterval(this._clockTimer);let e=this._intervalMs;e>0&&(this._refreshTimer=setInterval(()=>{if(this._hass&&this._config){let r=Ke(this._config,this._get);this._apply(r,JSON.stringify(r.phaseInputs))}},Math.max(1e3,e))),this._clockTimer=setInterval(()=>{(this._banner||this._phase&&Ze(this._phase.phase,!1).showDuration)&&this.requestUpdate()},1e3)}_apply(e,r){let n=Date.now();this._tracker.current||this._restorePhase(e);let i=this._tracker.observe(e.phaseInputs,n,o=>this._seedSince(o));i.changed&&this._onTransition(i),(i.changed||!this._phase)&&this._savePhase(),e.ats!==this._lastAts&&(this._lastAts!==null&&e.ats!==null&&this._cutover++,this._lastAts=e.ats),this._snap=e,this._phase=i,this._statusKey=r,this._lastRefresh=n,this._flowsDirty=!0,this._trend&&(this._trend.add(n,e.home.power,xr(e)),this._trend.prune(n)),this.requestUpdate()}_onTransition(e){(e.phase==="outage"||e.phase==="starting"&&e.previous==="utility")&&this._outageSeq++;let r=gr(e.previous,e.phase);r&&(this._banner={event:r,at:Date.now(),id:++this._bannerSeq},clearTimeout(this._bannerTimer),this._bannerTimer=setTimeout(()=>{this._banner=null,this.requestUpdate()},9e3))}_seedSince(e){let r=this._config,n=i=>{let o=i?this._hass?.states[i]:void 0,a=o?Date.parse(o.last_changed):NaN;return Number.isFinite(a)?a:null};switch(e){case"outage":case"starting":return n(r.grid?.status);case"generator":return n(r.transfer_switch?.entity)??n(r.generator?.running);case"restored":return n(r.grid?.status)??n(r.transfer_switch?.entity);case"exercise":case"cooldown":return n(r.generator?.running);default:return n(r.grid?.status)}}get _storageKey(){return`${ae}:${_r(je(this._config).join("|"))}`}_savePhase(){let e=this._tracker.current;if(e)try{localStorage.setItem(this._storageKey,JSON.stringify(e))}catch{}}_restorePhase(e){try{let r=`${ae}:${_r(xt(this._config).join("|"))}`,n=localStorage.getItem(this._storageKey)??localStorage.getItem(r);if(!n)return;let i=JSON.parse(n);if(!i?.phase||!Number.isFinite(i.since))return;let o=["generator","restored","cooldown"].includes(i.phase)||i.lastGeneratorEnd!==null&&Date.now()-i.lastGeneratorEnd<this._cooldownMs;wt(e.phaseInputs,o)===i.phase&&this._tracker.restore(i)}catch{}}async _loadHistory(){let e=this._hass,r=this._config,n=this._trend;if(!e?.callWS||!r||!n)return;this._historyRequested=!0;let i=Date.now(),o=i-n.windowMs,a=await yr(e,je(r),o,i);if(!a||n!==this._trend)return;let l=new Ee(n.windowMs,n.count);vr(a,this._get,o,i,n.bucketMs/4,(u,d)=>{let h=Ke(r,d);l.add(u,h.home.power,xr(h))}),n.fillFrom(l),this.requestUpdate()}_syncEngineVisibility(){this._engine?.setVisible(this._inView&&!document.hidden)}_tap(e,r,n){let i=e?.tap_action??"more-info";if(i!=="none"){if(i==="navigate"){e?.navigation_path&&(history.pushState(null,"",e.navigation_path),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}})));return}if(i==="toggle"){let o=n??r;o&&this._hass?.callService?.("homeassistant","toggle",{entity_id:o});return}r&&this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:r}}))}}_keyTap(e,r){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),r())}_deviceViews(e){let r=this._config,n=e.devices.map(i=>{let o=this._hass?.states[i.cfg.entity],a=String(o?.attributes?.friendly_name??i.cfg.entity.split(".")[1]??i.cfg.entity);return{key:`d${i.index}`,name:i.cfg.name??a.replace(/\s+(power|consumption|load|watts)$/i,""),icon:i.cfg.icon??o?.attributes?.icon??"mdi:flash",power:i.power,current:i.current,active:i.active,high:i.high,share:i.share,entity:i.cfg.entity,tap:i.cfg,toggle:i.cfg.switch_entity,missing:i.missing}});if(e.other!==null){let i=e.home.power??0;n.push({key:"other",name:"Other",icon:"mdi:dots-horizontal-circle-outline",power:e.other,current:null,active:e.other>=bt,high:!1,share:i>0?Math.min(1,e.other/i):0,tap:{tap_action:"none"},missing:!1})}return r.sort_devices&&n.sort((i,o)=>(o.power??-1)-(i.power??-1)),n.slice(0,Math.max(1,r.max_devices??12))}_ensureLayout(e,r){let{w:n,h:i}=this._size,o=this._config;if(n<40||i<40)return null;let a={grid:!!o.grid,generator:!!o.generator,solar:!!o.solar,battery:!!o.battery},l=`${n}x${i}|${Object.values(a).join()}|${e}|${r}`;return l!==this._layoutKey&&(this._layout=lr({w:n,h:i,...a,devices:e,deviceExtraLine:r}),this._layoutKey=l,this._flowsDirty=!0),this._layout}_mix(e){let r=[],n=[];for(let o of Te)e.supply[o]>0&&(r.push(this._colors[o]),n.push(e.supply[o]));let i=r.length===1&&r[0]===this._colors.generator;return{colors:r,weights:n,style:i?"engine":"steady"}}_flowSpecs(){let e=this._layout,r=this._snap,n=this._config;if(!e||!r||!n)return[];let i=n.max_power??Math.max(n.generator?.rated_power??0,1e4),o=[],a=(p,f,g,m,b,$,k,M=22)=>{if(!f||!b.length||Math.abs(g)<=m)return;let E=Zt(g,i);o.push({id:p,samples:f.samples,direction:g>=0?1:-1,speed:(22+86*E)*e.s,colors:b,weights:$,style:k,size:(1.8+1.4*E)*e.s,spacing:M*e.s})},l=this._colors,u=p=>p?.threshold??B;if(a("grid",e.wires.grid,r.flows.grid,u(n.grid),[l.grid],[1],"steady"),a("generator",e.wires.generator,r.flows.generator,u(n.generator),[l.generator],[1],"engine"),r.ats){let p=r.ats==="generator";a("feed",e.wires.feed,r.flows.feed,u(p?n.generator:n.grid),[p?l.generator:l.grid],[1],p?"engine":"steady")}a("solar",e.wires.solar,r.flows.solar,u(n.solar),[l.solar],[1],"steady"),a("battery",e.wires.battery,r.flows.battery,u(n.battery),[l.battery],[1],"steady");let d=this._mix(r),h=this._deviceViews(r),c=0;return e.devices.forEach((p,f)=>{let g=h[f];g?.active&&g.power!==null&&(c+=g.power,a(`dev-${g.key}`,p.wire,g.power,0,d.colors,d.weights,d.style,34))}),a("stem",e.stem??void 0,c,0,d.colors,d.weights,d.style),o}_fmt(e){let r=this._config;return Yt(e,r.power_unit??"auto",r.decimals??1,this._locale)}_power(e,r){let n=this._fmt(e);return _`${n.value}<span class="unit">${n.unit}</span>${r?_`<span class="tag">${r}</span>`:y}`}render(){let e=this._config;if(!e)return y;let r=this._snap,n=this._colors,i=r?this._deviceViews(r):[],o=i.some(u=>u.current!==null),a=r?this._ensureLayout(i.length,o):null,l=`--emc-grid:${n.grid};--emc-generator:${n.generator};--emc-solar:${n.solar};--emc-battery:${n.battery};--emc-outage:${n.outage};`;return _`
      <ha-card class=${e.hide_background?"transparent":""} style=${l}>
        ${this._renderHeader()}
        <div class="stage" style="aspect-ratio:${ar(i.length>0,o)};--s:${a?.s??1}">
          ${r&&a?this._renderDiagram(r,a,i):y}
        </div>
        ${this._trend&&r?this._renderTrend():y}
        ${r?.missing.length?_`<div class="warn" title=${r.missing.join(", ")}>⚠ Entity not found: ${r.missing.join(", ")}</div>`:y}
      </ha-card>
    `}_renderHeader(){let e=this._config,r=this._phase,n=this._snap,i=y;if(r&&n){let a=n.supply.battery>0&&n.supply.battery>=n.supply.solar,l=Ze(r.phase,a),u=r.phase==="outage"||r.phase==="starting";i=_`<div class="pill tone-${l.tone} ${u?"alert":""}" role="status" aria-live="polite">
        <span class="dot"></span>${l.label}${l.showDuration?_`<span class="dur">${qe(Date.now()-r.since)}</span>`:y}
      </div>`}let o=this._banner;return _`<div class="header">
      ${e.title?_`<div class="title">${e.title}</div>`:y} ${i}
      ${o?Le(o.id,_`<div class="banner tone-${on(o.event)}">
              ${an(o.event)}<span class="what">${o.event.title}</span>
              <span class="when">${We(o.at,this._locale)}</span>
            </div>`):y}
    </div>`}_glowDefs(){let e=this._colors;return x`<defs>${Object.keys(e).map(r=>x`<radialGradient id="emc-glow-${r}-${this._uid}">
        <stop offset="0" stop-color=${e[r]} stop-opacity="0.42" />
        <stop offset="0.55" stop-color=${e[r]} stop-opacity="0.12" />
        <stop offset="1" stop-color=${e[r]} stop-opacity="0" />
      </radialGradient>`)}</defs>`}_glow(e){return`url(#emc-glow-${e}-${this._uid})`}_renderDiagram(e,r,n){let i=this._config,o=this._colors,a=r.s,l=g=>g?.threshold??B,u=e.grid?.available===!1,d=Je(e.supply),h=d?o[d]:"var(--emc-muted)",c=[],p=(g,m,b,$=!1)=>{g&&(b||$)&&c.push(x`<path class=${$?"dead":""} d=${g.d} style="--c:${m}" />`)};if(p(r.wires.grid,o.grid,Math.abs(e.flows.grid)>l(i.grid),u),p(r.wires.generator,o.generator,e.flows.generator>l(i.generator)),e.ats){let g=e.ats==="generator";p(r.wires.feed,g?o.generator:o.grid,Math.abs(e.flows.feed)>l(g?i.generator:i.grid))}p(r.wires.solar,o.solar,e.flows.solar>l(i.solar)),p(r.wires.battery,o.battery,Math.abs(e.flows.battery)>l(i.battery));let f=y;if(u&&r.wires.grid){let g=Fe(r.wires.grid.samples,r.wires.grid.samples.length*.42);f=Be(g.x,g.y,15*a,vt,"fault")}return _`
      <svg
        class="diagram"
        width=${r.w}
        height=${r.h}
        viewBox="0 0 ${r.w} ${r.h}"
        role="img"
        aria-label=${this._ariaSummary(e)}
      >
        ${this._glowDefs()}
        ${r.ats?x`<rect class="ats-box" x=${r.ats.x-r.ats.w/2} y=${r.ats.y-r.ats.h/2} width=${r.ats.w}
              height=${r.ats.h} rx=${5*a} stroke-width=${1.2*a} />`:y}
        <g class="tracks">
          ${Object.values(r.wires).map(g=>x`<path d=${g.d} />`)}
          ${r.stem?x`<path d=${r.stem.d} />`:y} ${r.devices.map(g=>x`<path d=${g.wire.d} />`)}
        </g>
        <g class="live">${c}</g>
        <g class="devlive" style="--c:${h}">
          ${r.stem&&d&&n.some(g=>g.active)?x`<path d=${r.stem.d} />`:y}
          ${r.devices.map((g,m)=>d&&n[m]?.active?x`<path d=${g.wire.d} />`:y)}
        </g>
        ${f}
        <g class="particles"></g>
        ${r.ats?this._renderAts(e,r):y} ${this._renderSources(e,r)} ${this._renderHome(e,r)}
        ${r.devices.map((g,m)=>n[m]?this._renderDeviceRing(n[m],g,h,d):y)}
      </svg>
      <div class="overlay">
        ${this._renderLabels(e,r)}
        ${r.devices.map((g,m)=>n[m]?this._renderDevice(n[m],g,h,r):y)}
        ${n.length>r.devices.length?_`<div class="more">+${n.length-r.devices.length} more</div>`:y}
      </div>
    `}_renderAts(e,r){let n=r.ats,i=r.s,o=this._colors,a=e.grid?.available===!1,l=e.ats,u=l==="utility"?n.angle:l==="generator"?-n.angle:0,d=l==="generator"?o.generator:l==="utility"?a?o.outage:o.grid:"var(--emc-muted)",h=l==="generator"?n.generator:n.utility,c=this._config,p=c.transfer_switch?.entity;return x`<g class="ats" style="--c:${d}" role="button" tabindex="0"
        aria-label="Transfer switch: ${l??"unknown"}"
        @click=${()=>this._tap(c.transfer_switch,p??c.generator?.running)}
        @keydown=${f=>this._keyTap(f,()=>this._tap(c.transfer_switch,p??c.generator?.running))}>
      <circle class="contact ${l==="utility"&&!a?"on":""}" cx=${n.utility.x} cy=${n.utility.y}
        r=${2.4*i} stroke-width=${1.3*i} style="--c:${o.grid}" />
      <circle class="contact ${l==="generator"?"on":""}" cx=${n.generator.x} cy=${n.generator.y}
        r=${2.4*i} stroke-width=${1.3*i} style="--c:${o.generator}" />
      <g class="blade" style="transform:rotate(${u}deg);transform-origin:${n.pivot.x}px ${n.pivot.y}px">
        <line x1=${n.pivot.x} y1=${n.pivot.y} x2=${n.pivot.x-n.bladeLen} y2=${n.pivot.y} stroke-width=${3*i} />
      </g>
      <circle class="pivot" cx=${n.pivot.x} cy=${n.pivot.y} r=${3.2*i} />
      ${this._cutover>0&&l!=="open"?Le(this._cutover,x`<circle class="spark" cx=${h.x} cy=${h.y} r=${5*i} stroke-width=${1.6*i} />`):y}
      <text class="ats-label" x=${n.x} y=${n.y+n.h/2+10*i} font-size=${7.5*i}>ATS</text>
    </g>`}_node(e,r,n,i,o,a,l=y){let u=this._colors;return x`<g class="node ${e} ${n}" style="--c:${u[e]}" role="button" tabindex="0" aria-label=${o}
        @click=${a} @keydown=${d=>this._keyTap(d,a)}>
      <circle class="glow" cx=${r.x} cy=${r.y} r=${r.r*2} fill=${this._glow(e)} />
      <circle class="disc" cx=${r.x} cy=${r.y} r=${r.r} />
      <circle class="ring" cx=${r.x} cy=${r.y} r=${r.r} />
      ${l}
      ${Be(r.x,r.y,r.r*1.12,i)}
    </g>`}_renderSources(e,r){let n=this._config,i=[],o=l=>l?.threshold??B,a=r.s;if(r.nodes.grid&&e.grid){let l=e.grid,u=l.available===!1?"down":Math.abs(e.flows.grid)>o(n.grid)?"active":l.available?"idle":"";i.push(this._node("grid",r.nodes.grid,u,ft(l.available===!1),"Utility",()=>this._tap(n.grid,n.grid?.entity??n.grid?.status??n.grid?.voltage)))}if(r.nodes.generator&&e.generator){let l=e.generator,u=r.nodes.generator,d=l.supplying>o(n.generator),h=l.starting?"starting":d?"active running":l.running?"running":"standby",c=y;if(l.loadPct!==null&&l.running){let p=u.r+4.5*a,f=2*Math.PI*p,g=Math.min(100,Math.max(0,l.loadPct));c=x`
          <circle class="gauge-track" cx=${u.x} cy=${u.y} r=${p} stroke-width=${2.6*a} />
          <circle class="gauge ${g>=85?"hot":""}" cx=${u.x} cy=${u.y} r=${p} stroke-width=${2.6*a}
            stroke-dasharray="${f*g/100} ${f}" transform="rotate(-90 ${u.x} ${u.y})" />`}i.push(this._node("generator",u,h,yt(l.running),"Generator",()=>this._tap(n.generator,n.generator?.entity??n.generator?.running),c))}if(r.nodes.solar&&e.solar){let l=e.flows.solar>o(n.solar);i.push(this._node("solar",r.nodes.solar,l?"active":"idle",rr,"Solar",()=>this._tap(n.solar,n.solar?.entity)))}if(r.nodes.battery&&e.battery){let l=e.battery,u=e.flows.battery,d=Math.abs(u)>o(n.battery);i.push(this._node("battery",r.nodes.battery,d?"active":"idle",nr(l.soc,u<-o(n.battery)),"Battery",()=>this._tap(n.battery,n.battery?.soc??n.battery?.entity)))}return i}_renderHome(e,r){let n=this._config,i=this._colors,o=r.nodes.home,a=r.s,l=Te.reduce((m,b)=>m+e.supply[b],0),u=this._phase?.phase,d=(u==="outage"||u==="starting")&&l<=B,h=Je(e.supply),c=[];if(l>0){let m=Te.filter(k=>e.supply[k]/l>=.02),b=m.length>1?7:0,$=0;for(let k of m){let M=e.supply[k]/l*360;M-b>1&&c.push(x`<path class="seg" d=${Kt(o.x,o.y,o.r,$+b/2,$+M-b/2)}
            stroke=${i[k]} stroke-width=${4.2*a} />`),$+=M}}let p=this._fmt(e.home.power),f=_e(e.home.current,this._locale,e.home.currentEstimated),g=this._outageSeq>0?"flicker":"";return x`<g class="node home ${d?"dark":""}" role="button" tabindex="0" aria-label="Home"
        @click=${()=>this._tap(n.home,n.home?.entity)}
        @keydown=${m=>this._keyTap(m,()=>this._tap(n.home,n.home?.entity))}>
      ${h?x`<circle cx=${o.x} cy=${o.y} r=${o.r*1.75} fill=${this._glow(h)} />`:y}
      <circle class="disc" cx=${o.x} cy=${o.y} r=${o.r} />
      <circle class="ring-base" cx=${o.x} cy=${o.y} r=${o.r} stroke-width=${4.2*a} />
      ${c}
      ${Le(this._outageSeq,x`<g class=${g}>${Be(o.x,o.y-o.r*.3,o.r*.74,tr)}</g>`)}
      <text class="home-value" x=${o.x} y=${o.y+o.r*(f?.3:.42)} font-size=${14*a}>
        ${d?"No power":p.value}<tspan class="u" font-size=${10*a} dx=${2*a}>${d?"":p.unit}</tspan>
      </text>
      ${f&&!d?x`<text class="home-sub" x=${o.x} y=${o.y+o.r*.62} font-size=${9.5*a}>${f}</text>`:y}
    </g>`}_renderLabels(e,r){let n=this._config,i=this._colors,o=this._locale,a=[],l=c=>c?.threshold??B,u=(c,p,f,g)=>_`<div
        class="label ${c.anchor==="middle"?"mid":""} ${c.align}"
        style="left:${c.x}px;top:${c.y}px;max-width:${c.maxWidth}px;--c:${p}"
        @click=${f}
      >
        ${g}
      </div>`,d=c=>{let p=c.filter(f=>!!f);return p.length?_`<div class="detail">${p.map(f=>_`<span>${f}</span>`)}</div>`:y},h=c=>c.length?c.map((p,f)=>`L${f+1} ${D(p,1,o)} A`).join("\u2002"):null;if(r.labels.grid&&e.grid){let c=e.grid,p=e.ats==="generator",f=c.available!==!1&&!p,g;if(c.available===!1)g=_`<div class="value alarm">Outage</div>`;else if(p)g=_`<div class="value quiet">${c.available?"Available":"Disconnected"}</div>`;else{let m=(c.power??0)<-l(n.grid);g=_`<div class="value">${this._power(c.power===null?null:Math.abs(c.power),m?"export":void 0)}</div>`}a.push(u(r.labels.grid,i.grid,()=>this._tap(n.grid,n.grid?.entity??n.grid?.status),_`<div class="name">${n.grid?.name??"Utility"}</div>
            ${g}
            ${d([mt(c.voltage,o),f&&(h(c.legs)??_e(c.current,o,c.currentEstimated)),c.available!==!1&&gt(c.frequency,o)])}`))}if(r.labels.generator&&e.generator){let c=e.generator,p=c.supplying>l(n.generator),f;if(p){let m=c.loadPct!==null?`${D(c.loadPct,0,o)}% load`:void 0;f=_`<div class="value accent">${this._power(c.supplying,m)}</div>`}else c.starting?f=_`<div class="value quiet accent">Starting…</div>`:c.running?f=_`<div class="value quiet accent">Running</div>`:f=_`<div class="value quiet">${c.statusText?er(c.statusText):"Standby"}</div>`;let g=c.fuel?_`<span class="chip ${c.fuel.unit==="%"&&c.fuel.value<25?"low":""}"
            >Fuel ${D(c.fuel.value,0,o)}${c.fuel.unit==="%"?"%":` ${c.fuel.unit}`}</span
          >`:y;a.push(u(r.labels.generator,i.generator,()=>this._tap(n.generator,n.generator?.entity??n.generator?.running),_`<div class="name">${n.generator?.name??"Generator"} ${g}</div>
            ${f}
            ${c.running?d([mt(c.voltage,o),p&&(h(c.legs)??_e(c.current,o,c.currentEstimated)),gt(c.frequency,o)]):y}`))}if(r.labels.solar&&e.solar&&a.push(u(r.labels.solar,i.solar,()=>this._tap(n.solar,n.solar?.entity),_`<div class="name">${n.solar?.name??"Solar"}</div>
            <div class="value">${this._power(e.solar.power)}</div>`)),r.labels.battery&&e.battery){let c=e.battery,p=e.flows.battery,f=l(n.battery),g=p<-f?"Charging":p>f?"Discharging":"Idle",m=this._fmt(Math.abs(p));a.push(u(r.labels.battery,i.battery,()=>this._tap(n.battery,n.battery?.soc??n.battery?.entity),_`<div class="name">${n.battery?.name??"Battery"}</div>
            <div class="value">
              ${c.soc!==null?_`${D(c.soc,0,o)}<span class="unit">%</span>`:this._power(c.power)}
            </div>
            <div class="detail">${g==="Idle"?g:`${g} ${m.value} ${m.unit}`}</div>`))}return a}_renderDeviceRing(e,r,n,i){let o=this._layout.s,a=2*Math.PI*r.r,l=e.active?Math.max(.04,e.share):0;return x`
      ${i?x`<circle class="dev-glow ${e.high?"on":""}" cx=${r.x} cy=${r.y} r=${r.r*2} fill=${this._glow(i)} />`:y}
      <circle class="dev-ring" cx=${r.x} cy=${r.y} r=${r.r} stroke-width=${1.4*o} />
      <circle class="dev-share" cx=${r.x} cy=${r.y} r=${r.r} stroke-width=${2.4*o} style="--c:${n}"
        stroke-dasharray="${a*l} ${a}" transform="rotate(-90 ${r.x} ${r.y})" />`}_renderDevice(e,r,n,i){let o=i.s,a=this._fmt(e.power),l=e.current!==null?_e(e.current,this._locale):null,u=e.active&&e.share>0?` \xB7 ${Math.round(e.share*100)}% of home`:"",d=()=>this._tap(e.tap,e.entity,e.toggle);return _`<div
      class="device ${e.active?"active":""} ${e.high?"high":""}"
      style="left:${r.x}px;top:${r.y-r.r}px;width:${r.slot-4*o}px;--c:${n}"
      title="${e.name}: ${a.value} ${a.unit}${l?` \xB7 ${l}`:""}${u}"
      role="button"
      tabindex="0"
      @click=${d}
      @keydown=${h=>this._keyTap(h,d)}
    >
      <div class="dev-icon" style="width:${2*r.r}px;height:${2*r.r}px">
        <ha-icon .icon=${e.icon}></ha-icon>
      </div>
      <div class="dev-value">
        ${e.missing?_`<span class="warnmark">⚠</span>`:_`${a.value}<span class="unit">${a.unit}</span>`}
      </div>
      ${l?_`<div class="dev-amps">${l}</div>`:y}
      <div class="dev-name">${e.name}</div>
    </div>`}_renderTrend(){let e=this._trend,r=this._config,n=this._colors,i=Date.now(),o=e.points(i),a=e.stats(i),l=o.length,u=40,d=Math.max(1,...o.map(w=>w?.max??0))*1.08,h=w=>u-Math.max(0,w)/d*(u-2),c=w=>w==="none"?n.outage:n[w],p=[],f=[],g=[],m=new Set,b=0;for(;b<l;){let w=o[b];if(!w){b++;continue}let v=b;for(;v+1<l&&o[v+1]&&o[v+1].source===w.source;)v++;if(m.add(w.source),w.source==="none")g.push(x`<rect class="trend-dark" x=${b} y="0" width=${v-b+1} height=${u} />`);else{let Q=v+1<l&&o[v+1]?v+1:v,P="";for(let N=b;N<=Q;N++)P+=`${N===b?"M":"L"}${N+.5} ${h(o[N].avg).toFixed(2)}`;Q===b&&(P+=`L${b+1} ${h(w.avg).toFixed(2)}`);let H=b+.5,O=Q===b?b+1:Q+.5;p.push(x`<path d="${P}L${O} ${u}L${H} ${u}Z" fill="url(#emc-trend-${w.source}-${this._uid})" />`),f.push(x`<path class="trend-line" d=${P} stroke=${c(w.source)} />`)}b=v+1}let $=this._hoverIndex!==null?o[this._hoverIndex]:null,k=this._hoverIndex!==null?i-(l-1-this._hoverIndex)*e.bucketMs:0,M=w=>{let v=this._fmt(w);return _`<b>${v.value} ${v.unit}</b>`},E=r.update_interval??2;return _`<div class="trend">
      <div class="trend-head">
        <span>Load · ${Xt(r.trend_window??60)}</span>
        <span>avg ${M(a.avg)}</span>
        <span>peak ${M(a.peak)}</span>
        <span class="grow"></span>
        <span>${E>0?`every ${E}s`:"live"}</span>
      </div>
      <div
        class="trend-plot"
        @pointermove=${this._onTrendPointer}
        @pointerdown=${this._onTrendPointer}
        @pointerleave=${()=>{this._hoverIndex=null,this.requestUpdate()}}
      >
        <svg viewBox="0 0 ${l} ${u}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            ${Te.map(w=>x`<linearGradient id="emc-trend-${w}-${this._uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color=${n[w]} stop-opacity="0.38" />
                <stop offset="1" stop-color=${n[w]} stop-opacity="0.02" />
              </linearGradient>`)}
          </defs>
          ${g} ${p} ${f}
          <line class="trend-base" x1="0" y1=${u-.5} x2=${l} y2=${u-.5} />
          ${this._hoverIndex!==null?x`<line class="trend-cursor" x1=${this._hoverIndex+.5} y1="0" x2=${this._hoverIndex+.5} y2=${u} />`:y}
        </svg>
        ${e.size===0||o.every(w=>!w)?_`<div class="trend-empty">Collecting data…</div>`:y}
        ${this._hoverIndex!==null?_`<div class="trend-tip" style="left:${(this._hoverIndex+.5)/l*100}%">
              ${$?_`<i style="--c:${c($.source)}"></i>${We(k,this._locale)} ·
                    ${M($.avg)} · ${Qe[$.source]}`:_`${We(k,this._locale)} · no data`}
            </div>`:y}
      </div>
      <div class="legend">
        ${["grid","generator","solar","battery","none"].filter(w=>m.has(w)).map(w=>_`<span
                ><i style="--c:${c(w)}"></i>${w==="grid"?r.grid?.name??Qe.grid:Qe[w]}${w==="generator"&&a.generatorMs>0?` ${qe(a.generatorMs)}`:w==="none"&&a.outageMs>0?` ${qe(a.outageMs)}`:""}</span
              >`)}
      </div>
    </div>`}_ariaSummary(e){let r=[],n=this._phase?Ze(this._phase.phase,e.supply.battery>0).label:"";n&&r.push(n);let i=this._fmt(e.home.power);r.push(`Home ${i.value} ${i.unit}`);for(let o of Te)if(e.supply[o]>0){let a=this._fmt(e.supply[o]);r.push(`${Qe[o]} ${a.value} ${a.unit}`)}return r.join(". ")}};Ye.styles=fr;function xr(s){let t=Je(s.supply);return t||(s.ats==="generator"?"generator":s.grid&&s.grid.available!==!1?"grid":!s.grid&&s.generator?.running?"generator":s.grid?"none":"grid")}function on(s){return s.kind==="outage"?"outage":s.kind==="generator"||s.kind==="info"?"generator":"grid"}function an(s){let t=s.kind==="outage"?vt:s.kind==="utility"?ft(!1):yt(!1),e=s.kind==="outage"?"":"glyph";return _`<svg viewBox="0 0 24 24" aria-hidden="true"><g class=${e}>${t}</g></svg>`}customElements.get(ae)||customElements.define(ae,Ye);window.customCards=window.customCards??[];window.customCards.some(s=>s.type===ae)||window.customCards.push({type:ae,name:"Energy Monitor Card",description:"Utility, generator, solar and battery power flow with transfer-switch cut-over.",preview:!0});console.info(`%c ENERGY-MONITOR-CARD %c v${nn} `,"color:#fff;background:#ff8a1f;font-weight:700;border-radius:4px 0 0 4px;padding:2px 4px","color:#ff8a1f;background:#1c1d21;border-radius:0 4px 4px 0;padding:2px 4px");export{Ye as EnergyMonitorCard,sn as normalizeConfig};
