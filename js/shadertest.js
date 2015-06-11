

THREE.TestShader = {
	uniforms: {
		"tColor": { type: "t", value:null},
		"tDepth": { type: "t", value: null},
		"znear": {type: "f", value: 1.00},
		"zfar": {type: "f", value: 1000.0},
		"dfar": {type: "f", value: 0},
		"dnear": {type: "f", value:0},
		"textureWidth": {type: "f", value:1.0 },
		"textureHeight": {type: "f", value:1.0}
	},

	vertexShader:[
		"varying vec2 vUv;",

		"void main() {", 
			"vUv =uv;",
			"gl_Position = projectionMatrix *modelViewMatrix *vec4(position, 1.0);",
		"}"
	].join("\n"),

	fragmentShader: [
		"varying vec2 vUv;",

		"uniform sampler2D tColor;",
		"uniform sampler2D tDepth;",
		"uniform float znear;",
		"uniform float zfar;",
		"uniform float dnear;",
		"uniform float dfar;",
		"uniform float textureWidth;",
		"uniform float textureHeight;",

		
		"void main() {",

			"float depthb = texture2D(tDepth, vUv).x;",
			"float depthn = 2.0 * depthb -1.0;",
			"float depth = (2.0* znear *zfar)/(zfar +znear - depthn * (zfar- znear));",
			
			"float size = 1.25;",
			"vec2 texelsize = vec2(1.0/textureWidth, 1.0/textureHeight) * size;",
			
			"float kernel[3];",
			"kernel[0]=4.0/16.0; kernel[1]=2.0/16.0; kernel[2]=1.0/16.0;",

			"vec4 colour = vec4(0.0);",
			"vec4 temp = vec4(0.0);",

			"if ( (depth < dnear) || (depth > dfar) )",
			"{",
				"for (int x=-1; x<2; x++) {",
					"for (int y=-1; y<2; y++) {",
						"vec2 offset = vUv + vec2(texelsize.x * float(x), texelsize.y * float(y));",
						"if ( (offset.x >= 0.0) && (offset.x <= 1.0) && (offset.y >= 0.0) && (offset.y <= 1.0) ){",
					
							"temp = texture2D(tColor, offset);",
							"colour += temp*kernel[(x*x + y*y)];",
						"}",
					"}",
				"}",
			"}",
			"else",
				"colour = texture2D(tColor,vUv);",

			"gl_FragColor.xyz = colour.xyz;",
			"gl_FragColor.w = 1.0;",

		"}"
	].join("\n")
};